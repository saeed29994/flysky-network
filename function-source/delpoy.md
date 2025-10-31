firebase deploy --only functions:onAllianceMessageCreate
firebase deploy --only functions:onGlobalPostCreate
firebase deploy --only functions:onAlliancePostCreate
firebase deploy --only functions:onGlobalCommentCreate
firebase deploy --only functions:onAllianceCommentCreate
firebase deploy --only functions:onGlobalPostReactionCreate
firebase deploy --only functions:onAlliancePostReactionCreate

# دوال إشعارات الدردشة
firebase deploy --only functions:onPublicRoomMessageCreate
firebase deploy --only functions:onAllianceRoomMessageCreate

# دوال المكافآت اليومية
firebase deploy --only functions:onGlobalPostCreateReward
firebase deploy --only functions:onAlliancePostCreateReward
firebase deploy --only functions:onGlobalPostReactionReward
firebase deploy --only functions:onAlliancePostReactionReward
firebase deploy --only functions:onPublicMessageReward
firebase deploy --only functions:onAllianceMessageReward
firebase deploy --only functions:initializeAllianceUser
firebase deploy --only functions:getUserDailyRewards
firebase deploy --only functions:getUserDailyRewardsSummary

# دوال المنشورات والتعليقات
firebase deploy --only functions:getPosts
firebase deploy --only functions:createPost
firebase deploy --only functions:addComment
firebase deploy --only functions:toggleReaction
أو إذا كنت تريد نشر جميع دوال التحالف دفعة واحدة:

cd function-source
firebase deploy --only functions