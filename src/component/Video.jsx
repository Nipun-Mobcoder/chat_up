/* eslint-disable react/prop-types */
import videojs from 'video.js';
import VideoPlayer from './VideoPlayer.jsx';
import { useRef } from 'react';

function Video({videoLink}) {
  const playerRef = useRef(null);

  const URL= videoLink || import.meta.env.REACT_APP_VIDEO_URL

  const videoPlayerOptions = {
    controls: true,
    responsive: true,
    fluid: true,
    autoplay: false,
    sources: [
      {
        src: URL,
        type: "application/x-mpegURL",
      },
    ],
  };

  const handlePlayerReady = (player) => {
    playerRef.current = player;

    player.on("waiting", () => {
      videojs.log("Player is waiting");
    });

    player.on("dispose", () => {
      videojs.log("Player will dispose");
    });
  };

  return (
      <VideoPlayer options={videoPlayerOptions} onReady={handlePlayerReady} />
  );
}

export default Video;
