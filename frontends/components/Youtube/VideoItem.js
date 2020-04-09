import React from 'react';

const VideoItem = ({ video, handleVideoSelect, style, className }) => (
  <div
    onClick={() => handleVideoSelect(video)}
    className={className}
    style={style}
    onChange={() => alert('more')}
  >
    <img
      className="image"
      src={video.snippet.thumbnails.medium.url}
      alt={video.snippet.description}
    />
  </div>
);

export default VideoItem;
