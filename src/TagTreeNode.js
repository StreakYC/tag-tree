/* @flow */

import LiveSet from 'live-set';
import type {LiveSetController} from 'live-set';

export type TagTreeNodeController<T> = {
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

export default class TagTreeNode<T> {
  _init: TagTreeNodeInit<T>;
  _ownedByTag: Map<string, {
    liveSet: LiveSet<TagTreeNode<T>>;
    controller: LiveSetController<TagTreeNode<T>>;
  }> = new Map();

  constructor(init: TagTreeNodeInit<T>) {
    this._init = init;
    this._init.executor({
      addOwnedNode: (tag, node) => {
        let entry = this._ownedByTag.get(tag);
        if (!entry) {
          entry = this._createTagEntry();
          this._ownedByTag.set(tag, entry);
        }
        const {controller} = entry;
        controller.add(node);
      },
      removeOwnedNode: (tag, node) => {
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
  }

  _createTagEntry(): Object {
    let controller;
    const liveSet = new LiveSet({
      read: () => new Set(),
      listen: _controller => {
        controller = _controller;
      }
    });
    liveSet.subscribe({}); // force activation
    if (!controller) throw new Error();
    return {liveSet, controller};
  }

  getValue(): T {
    return this._init.value;
  }

  getParent(): ?TagTreeNode<T> {
    return this._init.parent;
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
}
