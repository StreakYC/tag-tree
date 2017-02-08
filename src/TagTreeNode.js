/* @flow */

import LiveSet from 'live-set';
import type {LiveSetController} from 'live-set';

export type TagTreeNodeController<T> = {
  node: TagTreeNode<T>;
  addOwnedNode(tag: string, node: TagTreeNode<T>): void;
  removeOwnedNode(tag: string, node: TagTreeNode<T>): void;
  end(): void;
};

export type TagTreeNodeInit<T> = {|
  value: T;
  parent: ?TagTreeNode<T>;
  ownedTags: Set<string>;
  executor: (controller: TagTreeNodeController<T>) => void;
|};

type TagEntry<T> = {
  liveSet: LiveSet<TagTreeNode<T>>;
  controller: LiveSetController<TagTreeNode<T>>;
};

export default class TagTreeNode<T> {
  _init: TagTreeNodeInit<T>;
  _ownedNodes: Map<TagTreeNode<T>, string> = new Map();
  _ownedByTag: Map<string, TagEntry<T>> = new Map();

  constructor(init: TagTreeNodeInit<T>) {
    this._init = init;
    this._init.executor({
      node: this,
      addOwnedNode: (tag, node) => {
        this._ownedNodes.set(node, tag);
        let entry = this._ownedByTag.get(tag);
        if (!entry) {
          entry = this._createTagEntry();
          this._ownedByTag.set(tag, entry);
        }
        const {controller} = entry;
        controller.add(node);
      },
      removeOwnedNode: (tag, node) => {
        this._ownedNodes.delete(node);
        const entry = this._ownedByTag.get(tag);
        if (!entry) throw new Error('tag not owned');
        const {controller} = entry;
        controller.remove(node);
      },
      end: () => {
        this._ownedByTag.forEach(({controller}) => {
          controller.end();
        });
      }
    });
    this._init.executor = () => {}; // release reference
  }

  _createTagEntry(): TagEntry<T> {
    return LiveSet.active();
  }

  getValue(): T {
    return this._init.value;
  }

  getParent(): null|TagTreeNode<T> {
    return this._init.parent || null;
  }

  getOwnedByTag(tag: string): LiveSet<TagTreeNode<T>> {
    let entry = this._ownedByTag.get(tag);
    if (!entry) {
      if (!this._init.ownedTags.has(tag)) {
        throw new Error(`tag not owned: ${tag}`);
      }
      entry = this._createTagEntry();
      this._ownedByTag.set(tag, entry);
    }
    return entry.liveSet;
  }

  getOwned(): Map<string, LiveSet<TagTreeNode<T>>> {
    const m = new Map();
    this._ownedByTag.forEach(({liveSet}, tag) => {
      m.set(tag, liveSet);
    });
    return m;
  }

  getTag(): null|string {
    const {parent} = this._init;
    return parent ? parent.getTagOfOwnedNode(this) : null;
  }

  ownsNode(node: TagTreeNode<T>): boolean {
    return this._ownedNodes.has(node);
  }

  getTagOfOwnedNode(node: TagTreeNode<T>): string {
    const tag = this._ownedNodes.get(node);
    if (tag == null) throw new Error('node not owned');
    return tag;
  }
}
