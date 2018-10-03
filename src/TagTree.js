/* @flow */

import LiveSet from 'live-set';
import type {LiveSetController} from 'live-set';

import TagTreeNode from './TagTreeNode';
import type {TagTreeNodeController} from './TagTreeNode';

export type TagTreeController<T> = {
  tree: TagTree<T>;
  addTaggedValue(parent: TagTreeNode<T>, tag: string, value: T): TagTreeNode<T>;
  removeTaggedNode(parent: TagTreeNode<T>, tag: string, node: TagTreeNode<T>): void;
  end(): void;
};

export type TagTreeInit<T> = {|
  root: T;
  tags: $ReadOnlyArray<{| tag: string, ownedBy?: ?$ReadOnlyArray<string> |}>;
  executor: (controller: TagTreeController<T>) => void;
|};

const EMPTY_ARRAY: any[] = Object.freeze([]);

export default class TagTree<T> extends TagTreeNode<T> {
  _nodeControllers: Map<TagTreeNode<T>, TagTreeNodeController<T>> = new Map();
  _lookupTable: Map<T, Array<TagTreeNode<T>>>;
  _allByTag: Map<string, {
    ownedTags: Set<string>;
    liveSet: LiveSet<TagTreeNode<T>>;
    controller: LiveSetController<TagTreeNode<T>>;
  }>;

  constructor(init: TagTreeInit<T>) {
    let rootNodeController;
    super({
      value: init.root,
      parent: null,
      ownedTags: new Set(init.tags.map(({tag}) => tag)),
      executor: (controller) => {
        rootNodeController = controller;
      }
    });
    if (!rootNodeController) throw new Error();
    this._nodeControllers.set(this, rootNodeController);

    this._lookupTable = new Map([[init.root, [this]]]);

    this._allByTag = new Map();
    init.tags.forEach(({tag}) => {
      const {liveSet, controller} = LiveSet.active();
      if (this._allByTag.has(tag)) throw new Error('Tag specified twice: '+tag);
      this._allByTag.set(tag, {ownedTags: new Set(), liveSet, controller});
    });

    init.tags.forEach(({tag, ownedBy}) => {
      if (!ownedBy) return;
      ownedBy.forEach(owningTag => {
        const entry = this._allByTag.get(owningTag);
        if (!entry) throw new Error(`unknown ownedBy value for ${tag}: ${owningTag}`);
        entry.ownedTags.add(tag);
      });
    });

    const controller = {
      tree: this,
      addTaggedValue: (parent, tag, value) => {
        const tagEntry = this._allByTag.get(tag);
        if (!tagEntry) throw new Error(`unknown tag: ${tag}`);

        let controller;
        const node = new TagTreeNode({
          value,
          parent,
          ownedTags: tagEntry.ownedTags,
          executor: (_controller) => {
            controller = _controller;
          }
        });
        if (!controller) throw new Error();
        this._nodeControllers.set(node, controller);

        tagEntry.controller.add(node);

        const valueNodes = this._lookupTable.get(value);
        if (valueNodes) {
          valueNodes.push(node);
        } else {
          this._lookupTable.set(value, [node]);
        }

        const parentController = this._nodeControllers.get(parent);
        if (!parentController) throw new Error('parent is not part of TagTree');
        parentController.addOwnedNode(tag, node);

        return node;
      },
      removeTaggedNode: (parent, tag, node) => {
        const tagEntry = this._allByTag.get(tag);
        if (!tagEntry) throw new Error(`unknown tag: ${tag}`);

        const parentController = this._nodeControllers.get(parent);
        if (!parentController) throw new Error('parent is not part of TagTree');

        const value = node.getValue();
        const nodes = this._lookupTable.get(value);
        if (!nodes) throw new Error('node was missing from lookup table before removal');
        if (nodes.length > 1) {
          const ix = nodes.indexOf(node);
          if (ix < 0) throw new Error('node was missing from list in lookup table before removal');
          nodes.splice(ix, 1);
        } else {
          this._lookupTable.delete(value);
        }

        node.getOwned().forEach((liveSet, tag) => {
          liveSet.values().forEach(childNode => {
            controller.removeTaggedNode(node, tag, childNode);
          });
        });

        tagEntry.controller.remove(node);
        parentController.removeOwnedNode(tag, node);
        this._nodeControllers.delete(node);
      },
      end: () => {
        this._nodeControllers.forEach(controller => {
          controller.end();
        });
        this._allByTag.forEach(({controller}) => {
          controller.end();
        });
      }
    };
    init.executor(controller);
    init.executor = () => {}; // release reference
  }

  getNodesForValue(value: T): $ReadOnlyArray<TagTreeNode<T>> {
    const l = this._lookupTable.get(value);
    return l ? Object.freeze(l.slice()) : EMPTY_ARRAY;
  }

  getAllByTag(tag: string): LiveSet<TagTreeNode<T>> {
    const entry = this._allByTag.get(tag);
    if (!entry) throw new Error(`tag does not exist in TagTree: ${tag}`);
    return entry.liveSet;
  }

  getAll(): Map<string, LiveSet<TagTreeNode<T>>> {
    const m = new Map();
    this._allByTag.forEach(({liveSet}, tag) => {
      m.set(tag, liveSet);
    });
    return m;
  }
}
