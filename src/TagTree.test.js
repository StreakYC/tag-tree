/* @flow */

import TagTree from './TagTree';

test('works', () => {
  let controller;
  const lt = new TagTree({
    root: '<root>',
    tags: [{tag: 'sidebar'}, {tag: 'comment', ownedBy: ['comment']}],
    executor: _controller => {
      controller = _controller;
    }
  });
  if (!controller) throw new Error();

  expect(controller.tree).toBe(lt);

  expect(lt.getParent()).toBe(null);
  expect(lt.getTag()).toBe(null);

  expect(() => lt.getOwnedByTag('foo')).toThrowError();

  const sidebars = lt.getAllByTag('sidebar');
  expect(Array.from(sidebars.values()).map(x=>x.getValue())).toEqual([]);

  controller.addTaggedValue(lt, 'sidebar', 'lol sidebar content');

  expect(Array.from(sidebars.values()).map(x=>x.getValue())).toEqual(['lol sidebar content']);

  const comments = lt.getOwnedByTag('comment');
  const allComments = lt.getAllByTag('comment');
  expect(Array.from(comments.values()).map(x=>x.getValue())).toEqual([]);

  const first = controller.addTaggedValue(lt, 'comment', 'FIRST');
  const firstReply = controller.addTaggedValue(first, 'comment', 'reply to first');

  expect(firstReply.getParent()).toBe(first);
  expect(firstReply.getTag()).toBe('comment');
  expect(first.getTagOfOwnedNode(firstReply)).toBe('comment');
  expect(() => firstReply.getTagOfOwnedNode(first)).toThrowError();

  controller.addTaggedValue(lt, 'comment', 'do not reply to FIRST');
  const firstReplyReply = controller.addTaggedValue(firstReply, 'comment', 'reply to reply to first');
  controller.addTaggedValue(firstReplyReply, 'comment', 'reply to reply to reply to first');


  expect(Array.from(comments.values()).map(x=>x.getValue())).toEqual(['FIRST', 'do not reply to FIRST']);

  expect(Array.from(first.getOwnedByTag('comment').values()).map(x=>x.getValue())).toEqual(['reply to first']);

  expect(Array.from(allComments.values()).map(x=>x.getValue())).toEqual(['FIRST', 'reply to first', 'do not reply to FIRST', 'reply to reply to first', 'reply to reply to reply to first']);

  expect(first.ownsNode(firstReply)).toBe(true);
  controller.removeTaggedNode(first, 'comment', firstReply);
  expect(first.ownsNode(firstReply)).toBe(false);
  expect(Array.from(allComments.values()).map(x=>x.getValue())).toEqual(['FIRST', 'do not reply to FIRST']);

  controller.end();
});

test('duplicate tags', () => {
  expect(() => new TagTree({
    root: '<root>',
    tags: [{tag: 'sidebar'}, {tag: 'comment', ownedBy: ['comment']}, {tag: 'sidebar'}],
    executor() {}
  })).toThrowError();
});
