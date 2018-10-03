import LiveSet from 'live-set';

export class TagTreeNode<T> {
  protected constructor();
  getValue(): T;
  getParent(): null|TagTreeNode<T>;
  getOwnedByTag(tag: string): LiveSet<TagTreeNode<T>>;
  getOwned(): Map<string, LiveSet<TagTreeNode<T>>>;
  getTag(): null|string;
  ownsNode(node: TagTreeNode<T>): boolean;
  getTagOfOwnedNode(node: TagTreeNode<T>): string;
}

export interface TagTreeController<T> {
  tree: TagTree<T>;
  addTaggedValue(parent: TagTreeNode<T>, tag: string, value: T): TagTreeNode<T>;
  removeTaggedNode(parent: TagTreeNode<T>, tag: string, node: TagTreeNode<T>): void;
  end(): void;
}

export interface TagTreeInit<T> {
  root: T;
  tags: ReadonlyArray<{tag: string, ownedBy?: null|ReadonlyArray<string>}>;
  executor: (controller: TagTreeController<T>) => void;
}

export class TagTree<T> extends TagTreeNode<T> {
  constructor(init: TagTreeInit<T>);
  getNodesForValue(value: T): ReadonlyArray<TagTreeNode<T>>;
  getAllByTag(tag: string): LiveSet<TagTreeNode<T>>;
  getAll(): Map<string, LiveSet<TagTreeNode<T>>>;
}
