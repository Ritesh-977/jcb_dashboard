import React from 'react';
import FacebookComments from '../components/FacebookComments';
import InstagramComments from '../components/InstagramComments';
import commentData from '../data/Comment_Data.json';

const fbComments = commentData.filter(c => c.Platform === 'Facebook');
const igComments = commentData.filter(c => c.Platform === 'Instagram');

const CommentsDashboard = () => (
  <div className="p-6 max-w-[1600px] mx-auto pb-10">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      <FacebookComments comments={fbComments} />
      <InstagramComments comments={igComments} />
    </div>
  </div>
);

export default CommentsDashboard;
