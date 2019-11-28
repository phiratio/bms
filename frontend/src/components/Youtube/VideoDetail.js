import React from 'react';

const VideoDetail = ({ video }) => {
  if (!video) {
    return null;
  }
  const videoSrc = `https://www.youtube.com/embed/${video.id.videoId}`;
  return (
    <div>
      <div
        className="embed"
        style={{

        }}
      >
        <iframe
          style={{

          }}
          src={`${videoSrc}?autoplay=1&hd=1`}
          allow="autoplay; fullscreen"
          frameBorder="0"
          title="Video player"
        />
      </div>
      <div className="segment">
        <h4 className="header">{video.snippet.title}</h4>
        <p>{video.snippet.description}</p>
      </div>
    </div>
  );
};

export default VideoDetail;
