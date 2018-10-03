# tag-tree

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/StreakYC/tag-tree/blob/master/LICENSE.txt) [![Circle CI](https://circleci.com/gh/StreakYC/tag-tree.svg?style=shield)](https://circleci.com/gh/StreakYC/tag-tree) [![npm version](https://badge.fury.io/js/tag-tree.svg)](https://badge.fury.io/js/tag-tree)

This class represents a hierarchical tree of tagged (named) values.

This class is used heavily in
[PageParserTree](https://github.com/StreakYC/page-parser-tree) to implement the
API that users query for elements. This class is not specific to and knows
nothing about HTMLElements or MutationObservers specifically; it just manages
[LiveSets](https://github.com/StreakYC/live-set) of values that refer to each
other in a hierarchy. PageParserTree instantiates a TagTree and uses DOM APIs
itself to keep the TagTree populated.

This class has methods intended to vaguely resemble certain DOM APIs, but
whenever collections of values are returned, they're always LiveSets that can
be subscribed to for changes.

Examples of usage of TagTree instances can be seen in the
[PageParserTree](https://github.com/StreakYC/page-parser-tree) documentation.

## API

### TagTree
`class TagTree<T> extends TagTreeNode<T>`

A TagTree instance has methods on it to find nodes anywhere in the tree no
matter what node owns them (`getAll()`, `getAllByTag(tag)`), and TagTree
extends TagTreeNode, so a TagTree is also the root node and has all methods of
a TagTreeNode too.

#### TagTree::constructor
`constructor({root: T, tags: Array<{tag: string, ownedBy?: ?Array<string>}>, executor: Function})`

The `root` value will be the value returned by calling `getValue()` on the
TagTree instance.

`tags` must be an array of all tags that the TagTree will ever encounter. The
optional `ownedBy` arrays must list what other tags a tag may own if it is to
own any.

The `executor` function will be called with a TagTreeController instance used
to control the values in the TagTree. TagTrees are read-only without a
reference to their TagTreeController, just like how a Promise is read-only
without a reference to their resolve and reject functions.

#### TagTree::getAllByTag
`getAllByTag(tag: string): LiveSet<TagTreeNode<T>>`

Get a [LiveSets](https://github.com/StreakYC/live-set) of all nodes with the
given tag in the tree. The LiveSet may be subscribed to for changes.

#### TagTree::getAll
`getAll(): Map<string, LiveSet<TagTreeNode<T>>>`

Get a Map of all tags to LiveSets of the nodes with that tag.

#### TagTree::getNodesForValue
`getNodesForValue(value: T): Array<TagTreeNode<T>>`

Finds all nodes with the given value in a TagTree. Multiple nodes may be
returned if the value has been inserted into the TagTree with different tags.

### TagTreeNode

A TagTreeNode has a value, a tag, a parent, and set of owned nodes that may be
queried.

The only documented way to get a TagTreeNode is from creating a TagTree or
using the TagTreeController's `addTaggedValue(parent, tag, value)` method. The
TagTreeNode's constructor is not considered part of the public API and may
change between versions.

#### TagTreeNode::getValue
`getValue(): T`

Get the value this node was instantiated with.

#### TagTreeNode::getParent
`getParent(): null|TagTreeNode<T>`

Returns the parent node. Returns `null` if this is the root node.

#### TagTreeNode::getOwnedByTag
`getOwnedByTag(tag: string): LiveSet<TagTreeNode<T>>`

Get a LiveSet of all nodes with the given tag owned by this node.

#### TagTreeNode::getOwned
`getOwned(): Map<string, LiveSet<TagTreeNode<T>>>`

Get a map of all owned tags to the LiveSets of owned nodes by that tag.

#### TagTreeNode::getTag
`getTag(): null|string`

Return the tag of this node. Returns `null` if this is the root node.

#### TagTreeNode::ownsNode
`ownsNode(node: TagTreeNode<T>): boolean`

Returns whether this node owns the given node.

#### TagTreeNode::getTagOfOwnedNode
`getTagOfOwnedNode(node: TagTreeNode<T>): string`

It is an error to pass this function a node not owned.

### TagTreeController

This object contains methods for controlling the values stored in a TagTree.

#### TagTreeController::tree
`tree<T>`

This is a reference to the TagTree controlled by the TagTreeController.

#### TagTreeController::addTaggedValue
`addTaggedValue(parent: TagTreeNode<T>, tag: string, value: T): TagTreeNode<T>`

Add a value to the TagTree. `parent` must either be the root (the TagTree
itself) or a node whose tag that has the new node-to-be's `tag` in its ownedBy
list.

#### TagTreeController::removeTaggedNode
`removeTaggedNode(parent: TagTreeNode<T>, tag: string, node: TagTreeNode<T>): void`

Remove a node from its parent.

It is an error to pass this function a `node` that is not owned by the `parent`
under the given `tag`.

All nodes owned by this node will be removed from the tree too recursively.

#### TagTreeController::end
`end(): void`

End all of the LiveSets managed by the TagTree. This will prevent any changes
from being made, and will cause all references to their subscribers to be
released.

## Types

Both [TypeScript](https://www.typescriptlang.org/) and
[Flow](https://flowtype.org/) type definitions for this module are included!
The type definitions won't require any configuration to use.
