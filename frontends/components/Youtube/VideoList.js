import React from 'react';
import VideoItem from './VideoItem';

const VideoList = ({ videos, handleVideoSelect, previousSearches, onSearch, getMoreSearchResults }) => {
  const distance = 0;
  let margin = 20;
  const renderedVideos = [];

  for (let i = 0; i < videos.length; i++) {
    renderedVideos.push(
      <VideoItem
        className="nav-element shoveler-rowitem-static video-item"
        style={{
          transform: `translate3d(${margin}px, 0px, 0px) scale(0.75)`,
          opacity: 0.5,
        }}
        key={videos[i].etag}
        video={videos[i]}
        handleVideoSelect={handleVideoSelect}
      />
    );
    margin += 596;
  }
  renderedVideos.push(<div onClick={() => getMoreSearchResults()} className="nav-element more" style={{display: "none"}}></div>)

  return (
    <div id="one-D-shoveler-container" className="list">
      <h1>
        <span className="badge badge-dark ml-3" style={{ fontSize: '40px' }}>Previous searches</span>
      </h1>
      <div className="previous-searches ml-3 mt-4 nav-group" style={{ fontSize: '46px' }}>
        {
          Array.isArray(previousSearches) && (
            previousSearches.map(el =>  <span onClick={() => onSearch(el, true)} className="nav-element badge badge-dark">{el}</span>)
          )
        }
      </div>
      <div id="shoveler-view" className="shoveler-row-container nav-group nav-scroll">
        {renderedVideos}
      </div>
    </div>
  );
};

export default VideoList;
