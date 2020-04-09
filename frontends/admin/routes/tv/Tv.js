import React from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { Card, CardBody, CardHeader, Col, Row } from 'reactstrap';
import YouTube from 'react-youtube';
import moment from 'moment';
import _ from 'lodash';
import s from './Tv.css';
import Avatar from '../../../components/Avatar';
import history from '../../../history';
import ReloadButton from '../../../components/ReloadButton';
import { SearchBar, VideoList, VideoDetail } from '../../../components/Youtube';
import Queue from '../../../components/Queue/Queue';

const YT_PLAYER_STATUS_PLAYING = 1;
const YT_PLAYER_STATUS_PAUSED = 2;
const KEYCODE_PLAY_PAUSE = 179;
const KEYCODE_SPACE = 32;
const KEYCODE_FASTFORWARD = 228;
const KEYCODE_REWIND = 227;

class Tv extends React.Component {
  state = {
    disabled: false,
    videos: [],
    playingVideo: null,
    originalVideo: null,
    fullscreen: false,
    ytPlayerState: -1,
    ytPlayerDuration: '00:00',
    ytPlayerCurrentTime: '00:00',
    timelinePlayhead: '0%',
    timeUpdater: null,
    searchQuery: null,
    previousSearches: [],
    showOverlay: false,
    overlayData: {
      user: {},
      employees: [],
    },
  };

  static contextTypes = {
    store: PropTypes.object.isRequired,
    fetch: PropTypes.func.isRequired,
    httpClient: PropTypes.object.isRequired,
    socket: PropTypes.object.isRequired,
    focus: PropTypes.func.isRequired,
    showNotification: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.debouncedOnSearch = _.debounce(this.onSearch.bind(this), 1500);
    this.debounceOnSeekTo = _.debounce(this.seekTo.bind(this), 500, {
      maxWait: 1000,
    });
    this.ytPlayer = null;
    this.playerReady = false;
    this.seekTime = 30;
    this.pressed = {
      [KEYCODE_FASTFORWARD]: 1,
      [KEYCODE_REWIND]: 1,
    };
  }

  onSearch = (query, setSearchQuery) => {
    if (!query) {
      return;
    }
    const trimmedQuery = String(query).trim();
    if (setSearchQuery) this.setState({ searchQuery: query });
    this.handleVideoSelect(null);
    if (query[query.length - 1] !== ' ')
      history.push(`/tv/search/?query=${trimmedQuery}`);
    if (trimmedQuery)
      this.context.socket.emit('tv.youtube.search', trimmedQuery);
  };

  handleVideoSelect = video => {
    if (video === null) {
      localStorage.removeItem('tv/lastVideo');
    }
    let parsedVideo = video;
    if (video) {
      history.push(`/tv/${video.id.videoId}`);
      const parser = new DOMParser().parseFromString(
        video.snippet.title,
        'text/html',
      );
      const parsedTitle = parser.body.textContent;

      parsedVideo = {
        ...video,
        ...{
          snippet: {
            ...video.snippet,
            title: parsedTitle,
          },
        },
      };
      localStorage.setItem('tv/lastVideo', JSON.stringify(parsedVideo));
      this.setPreviousSearches(this.state.searchQuery);
    }
    this.setState({ playingVideo: parsedVideo });
  };

  setSearchQuery = searchQuery => {
    this.setState({ searchQuery });
  };

  onYoutubeError = err => {
    if (err.message) {
      this.context.showNotification(
        err.message.replace(/(<a[^>]+>|<\/a>)/g, ''),
        'error',
      );
    } else if (Array.isArray(err.errors)) {
      err.errors.map(el => {
        this.context.showNotification(
          el.message.replace(/(<a[^>]+>|<\/a>)/g, ''),
          'error',
        );
      });
    }
  };

  onPause = () => {
    this.pauseVideo();
  };

  onResume = () => {
    this.playVideo();
  };

  onMenuButton = () => {
    alert('Functionality to this button will be added in later releases');
  };

  onPopState = event => {
    if (process.env.BROWSER) {
      const lastSearch = localStorage.getItem('tv/searchQuery');
      event.preventDefault();
      this.clearTimeUpdateInterval();
      if (lastSearch) {
        this.onSearch(lastSearch);
      }
    }
  };

  showWaitingRecord = record => {
    const overlayTimeout = setTimeout(() => {
      this.setState({ showOverlay: false });
    }, 8500);
    this.setState({
      showOverlay: true,
      overlayTimeout,
      overlayData: record,
    });
  };

  componentDidMount() {
    if (process.env.BROWSER) {
      const fullScreen = localStorage.getItem('tv/fullScreen');
      if (fullScreen) {
        this.toggleFullscreen();
        document.body.classList.add('dark-theme');
      }
      this.context.socket
        .on(`tv.youtube.searchResults`, this.setYoutubeSearchResults)
        .on(`tv.youtube.searchResults.append`, this.setYoutubeSearchResults)
        .on(`tv.youtube.setVideo`, this.onSetVideo)
        .on(`tv.youtube.error`, this.onYoutubeError)
        .on(`tv.youtube.pauseVideo`, this.pauseVideo)
        .on(`tv.show.waitingList`, this.showWaitingRecord);

      const lastVideo = localStorage.getItem('tv/lastVideo');
      if (lastVideo) {
        try {
          const parsedLastVideo = JSON.parse(lastVideo);
          this.handleVideoSelect(parsedLastVideo);
        } catch (e) {
          localStorage.removeItem('tv/lastVideo');
        }
      }
      const lastSearch = localStorage.getItem('tv/searchQuery');
      const previousSearches = this.getPreviousSearches();

      if (lastSearch) {
        this.setState({
          searchQuery: lastSearch,
          previousSearches,
        });
      }
      setTimeout(() => {
        window.addEventListener('keydown', this.onKeyDownListener, false);
        window.addEventListener('keyup', this.onKeyUpListener, false);
        window.addEventListener('popstate', this.onPopState);
        window.addEventListener('pause', this.onPause);
        window.addEventListener('resume', this.onResume);
        window.addEventListener('menubutton', this.onMenuButton);
      }, 2000);
      // disable sound notifications on TV
      document.getElementById('toggleSoundNotifications') &&
        document.getElementById('toggleSoundNotifications').click();
    }
  }

  getFormattedCurrentTime = () => {
    const currentTime = this.ytPlayer.getCurrentTime();
    return this.getFormattedTime(currentTime);
  };

  getFormattedTime = seconds => {
    const date = new Date(seconds * 1000 || 0).toISOString();
    return date.substr(11, 8);
  };

  getFormatedDuration = () => {
    const duration = this.ytPlayer.getDuration();
    return this.getFormattedTime(duration);
  };

  onKeyDownListener = event => {
    const { keyCode } = event;

    // Check if key is in array of allowed codes
    if (!this.state.playingVideo) return;

    if (keyCode === KEYCODE_REWIND) {
      this.pauseVideo();
      this.debounceOnSeekTo(
        this.ytPlayer.getCurrentTime() - this.seekTime,
        true,
      );
    } else if (keyCode === KEYCODE_FASTFORWARD) {
      this.pressed[KEYCODE_FASTFORWARD] += 1;
      if (this.pressed[KEYCODE_FASTFORWARD] > 12) {
        this.pauseVideo();
        this.debounceOnSeekTo(
          this.ytPlayer.getCurrentTime() + this.seekTime,
          true,
        );
      }
    }
  };

  timeUpdater = () => {
    const time = this.getFormattedCurrentTime();
    const currentTimelinePlayhead = this.getCurrentTimelinePlayhead();
    this.setState({
      ytPlayerCurrentTime: time,
      currentTime: this.ytPlayer.getCurrentTime(),
      duration: this.ytPlayer.getDuration(),
      timelinePlayhead: `${currentTimelinePlayhead}%`,
    });
  };

  getCurrentTimelinePlayhead = () =>
    this.calculateTimelinePlayhead(
      this.ytPlayer.getCurrentTime(),
      this.ytPlayer.getDuration(),
    );

  calculateTimelinePlayhead = (currentTime, duration) => {
    if (!currentTime || !duration) return 0;
    return currentTime / (duration / 100);
  };

  onKeyUpListener = event => {
    const { keyCode } = event;

    if (!this.state.playingVideo && !this.playerReady) return;

    if (keyCode === KEYCODE_FASTFORWARD) {
      if (this.pressed[KEYCODE_FASTFORWARD] < 12) {
        this.getNextVideo();
      }
      this.pressed[KEYCODE_FASTFORWARD] = 0;
    } else if (keyCode === KEYCODE_REWIND) {
      if (this.pressed[KEYCODE_REWIND] < 12) {
        this.getPreviousVideo();
      }
      this.pressed[KEYCODE_REWIND] = 0;
    }
    if (
      (this.ytPlayer &&
        this.ytPlayer.getPlayerState() === YT_PLAYER_STATUS_PAUSED &&
        KEYCODE_FASTFORWARD) ||
      (this.ytPlayer &&
        this.ytPlayer.getPlayerState() === YT_PLAYER_STATUS_PAUSED &&
        KEYCODE_REWIND)
    ) {
      this.playVideo();
    }

    if (keyCode === KEYCODE_PLAY_PAUSE || keyCode === KEYCODE_SPACE) {
      this.togglePlayback();
    }
  };

  setTimeUpdateInterval = () => {
    const timeUpdater = setInterval(this.timeUpdater, 1000);
    this.setState({ timeUpdater });
  };

  clearTimeUpdateInterval = () => {
    clearInterval(this.state.timeUpdater);
  };

  clearOverlayTimeout = () => {
    clearInterval(this.state.overlayTimeout);
  };

  componentWillUnmount() {
    if (process.env.BROWSER) {
      this.context.socket
        .off(`tv.youtube.searchResults`, this.setYoutubeSearchResults)
        .off('tv.youtube.setVideo', this.onSetVideo)
        .off(`tv.youtube.error`, this.onYoutubeError)
        .off(`tv.youtube.pauseVideo`, this.pauseVideo)
        .off(`tv.show.waitinglist.new`, this.showWaitingRecord);

      window.removeEventListener('keydown', this.onKeyDownListener);
      window.removeEventListener('keyup', this.onKeyUpListener);
      window.removeEventListener('popstate', this.onPopState);
      window.removeEventListener('pause', this.onPause);
      window.removeEventListener('resume', this.onResume);
      window.removeEventListener('menubutton', this.onMenuButton);
      this.clearTimeUpdateInterval();
      this.clearOverlayTimeout();
    }
  }

  clearSearchResults = () => {
    this.setState({ videos: [] });
    this.context.focus('youtubeSearch');
    localStorage.removeItem('tv/searchQuery');
  };

  getPreviousSearches = () => {
    if (!process.env.BROWSER) return;
    const previousSearches = localStorage.getItem('tv/previousSearches');
    if (!previousSearches) return;
    try {
      return JSON.parse(previousSearches);
    } catch (e) {
      this.context.showNotification(
        'Unable to parse previous searches',
        'error',
      );
    }
  };

  setPreviousSearches = searchQuery => {
    let previousSearches = this.state.previousSearches || [];
    if (searchQuery && previousSearches[0] !== searchQuery) {
      if (previousSearches.length >= 4) {
        previousSearches = previousSearches.slice(0, 3);
        previousSearches.unshift(searchQuery);
      } else {
        previousSearches.unshift(searchQuery);
      }
      this.setState({
        previousSearches,
      });
      localStorage.setItem(
        'tv/previousSearches',
        JSON.stringify(previousSearches),
      );
    }
  };

  onSetVideo = nextVideo => {
    this.handleVideoSelect(nextVideo);
  };

  setYoutubeSearchResults = (data, append) => {
    if (data.error) {
      if (Array.isArray(data.error.errors)) {
        data.error.errors.map(el => {
          this.context.showNotification(
            el.message.replace(/(<a[^>]+>|<\/a>)/g, ''),
            'error',
          );
        });
      }
    }

    if (data.items && append) {
      this.setState({ videos: [...this.state.videos, ...data.items] });
    } else if (data.items && !append) {
      this.setState({ videos: data.items });
    }
  };

  toggleFullscreen = () => {
    if (!this.state.fullscreen) {
      document.body.style.overflow = 'hidden';
      localStorage.setItem('tv/fullScreen', 'true');
      document.body.classList.add('dark-theme');
      document.body.classList.add('fullscreen');
    } else {
      document.body.style.overflow = null;
      localStorage.removeItem('tv/fullScreen');
      document.body.classList.remove('dark-theme');
      document.body.classList.remove('fullscreen');
    }
    this.setState({
      fullscreen: !this.state.fullscreen,
    });
  };

  onReady = ytEvent => {
    this.ytPlayer = ytEvent.target;
    if (this.ytPlayer.getPlaybackQuality() !== 'hd1080') {
      this.ytPlayer.setPlaybackQuality('hd1080');
    }
    this.playVideo();
    this.setState({
      currentTime: ytEvent.target.getCurrentTime(),
      duration: ytEvent.target.getDuration(),
    });
    this.playerReady = true;
    this.setTimeUpdateInterval();
  };

  getNextVideo = () => {
    this.context.socket.emit('tv.youtube.nextVideo', this.state.playingVideo);
  };

  getMoreSearchResults = () => {
    this.context.socket.emit('tv.youtube.search.more');
  };

  getPreviousVideo = () => {
    this.context.socket.emit(
      'tv.youtube.previousVideo',
      this.state.playingVideo,
    );
  };

  onEnd = async () => {
    this.getNextVideo();
    setTimeout(() => this.playVideo(), 1000);
  };

  onStateChange = event => {
    if (event.data === YT_PLAYER_STATUS_PAUSED) {
      this.clearTimeUpdateInterval();
    }
    if (event.data === YT_PLAYER_STATUS_PLAYING) {
      this.clearTimeUpdateInterval();
      this.setTimeUpdateInterval();
    }
    this.setState({
      ytPlayerDuration: this.getFormatedDuration(),
      ytPlayerState: event.data,
    });
  };

  onPreviousPressed = () => this.getPreviousVideo();

  onNextPressed = () => this.getNextVideo();

  pauseVideo = () => {
    this.clearTimeUpdateInterval();
    this.ytPlayer && this.ytPlayer.pauseVideo();
  };

  playVideo = noTimeout => {
    if (noTimeout) {
      this.ytPlayer.playVideo();
    } else {
      setTimeout(() => this.ytPlayer.playVideo(), 2000);
    }
  };

  seekTo = (time, allowSeekAhead) => {
    this.ytPlayer.seekTo(time, allowSeekAhead);
    const currentTimelinePlayhead = this.getCurrentTimelinePlayhead();
    const currentTime = this.getFormattedCurrentTime();
    this.setState({
      ytPlayerCurrentTime: currentTime,
      timelinePlayhead: `${currentTimelinePlayhead}%`,
    });
  };

  togglePlayback = () => {
    if (this.ytPlayer.getPlayerState() === YT_PLAYER_STATUS_PLAYING)
      this.pauseVideo();
    else this.playVideo(true);
  };

  render() {
    const { previousSearches } = this.state;
    // if (!this.state.init) {
    //   return <ReloadButton />;
    // }
    if (this.state.fullscreen) {
      this.context.socket.emit('queue.getEmployees');
    }
    const { overlayData } = this.state;
    const apptIsToday = moment(overlayData.apptStartTime)
      .startOf('day')
      .isSame(moment().startOf('day'));

    return (
      <Row>
        <Col xs={12}>
          <Card className={this.state.fullscreen ? 'fullscreen' : ''}>
            <CardBody style={{ padding: '0 1rem 0 0' }}>
              <Row>
                <Col
                  style={{ padding: '10px 5px 10px 20px' }}
                  xs={this.state.fullscreen ? '10-5' : 12}
                >
                  <SearchBar
                    setSearchQuery={this.setSearchQuery}
                    searchQuery={this.state.searchQuery}
                    toggleFullscreen={this.toggleFullscreen}
                    onSearch={this.debouncedOnSearch}
                    setPreviousSearches={this.setPreviousSearches}
                    clearSearchResults={this.clearSearchResults}
                  />
                </Col>
              </Row>
              <Row>
                <Col
                  style={{ padding: '0 0 0 15px', position: 'relative' }}
                  xs={this.state.fullscreen ? 10 : 12}
                >
                  <div
                    className="video-overlay"
                    style={{ opacity: this.state.showOverlay ? 0.95 : 0 }}
                  >
                    <Row
                      style={{ height: '100vh', paddingBottom: '60px' }}
                      className="text-center justify-content-center align-items-center"
                    >
                      <Col xs={12}>
                        <Avatar
                          size={200}
                          email={overlayData.user.email}
                          facebookId={overlayData.user.facebookId}
                          src={overlayData.user.avatar}
                          name={`${overlayData.user.firstName} ${
                            overlayData.user.lastName
                          }`}
                        />
                      </Col>
                      <Col
                        xs={12}
                        className="text-overflow"
                        style={{
                          fontSize: '110px',
                          textShadow: '2px 4px 3px rgba(0,0,0,0.3)',
                          fontWeight: 'bold',
                        }}
                      >
                        {overlayData.user.firstName} {overlayData.user.lastName}
                      </Col>
                      {overlayData.apptStartTime && overlayData.apptEndTime && (
                        <Row>
                          <Col
                            xs={12}
                            className="text-overflow"
                            style={{
                              fontSize: '78px',
                              textShadow: '2px 4px 3px rgba(0,0,0,0.3)',
                              fontWeight: 'bold',
                            }}
                          >
                            { apptIsToday ? 'Today' : moment(overlayData.apptStartTime).format('MMM Mo') }
                          </Col>
                          <Col
                            xs={12}
                            className="text-overflow"
                            style={{
                              fontSize: '78px',
                              textShadow: '2px 4px 3px rgba(0,0,0,0.3)',
                              fontWeight: 'bold',
                            }}
                          >
                            <p>
                              {moment(overlayData.apptStartTime).format('LT')} - {moment(overlayData.apptEndTime).format('LT')}
                            </p>
                          </Col>
                        </Row>
                      )}
                      <Col
                        className="text-overflow"
                        xs={12}
                        style={{ fontSize: '78px' }}
                      >
                        {overlayData.employees.map(el => (
                          <span
                            key={el.username}
                            className={`badge badge-${
                              el.username === 'Anyone' ? 'success' : 'warning'
                            }`}
                          >
                            {el.username}
                          </span>
                        ))}
                      </Col>
                    </Row>
                  </div>
                  {this.state.playingVideo &&
                    /videoId/.test(this.props.route.path) && (
                      <React.Fragment>
                        <YouTube
                          className={
                            this.state.fullscreen ? 'embed-fullscreen' : 'embed'
                          }
                          containerClassName="youtube-video-container"
                          videoId={this.state.playingVideo.id.videoId}
                          opts={{
                            // height: '390',
                            // width: '640',
                            playerVars: {
                              // https://developers.google.com/youtube/player_parameters
                              controls: 0,
                              // modestbranding: 1,
                              showinfo: 0,
                              enablejsapi: 1,
                              fs: 0,
                              autoplay: 1,
                              hd: 1,
                              // list: 'search',
                              vq: 'hd1080',
                            },
                          }}
                          onReady={this.onReady}
                          onEnd={this.onEnd}
                          onStateChange={this.onStateChange}
                        />
                        {this.state.ytPlayerState === YT_PLAYER_STATUS_PAUSED &&
                          this.state.fullscreen && (
                            <div className="player-controls-container">
                              <div className="player-controls-timeline-container">
                                <div className="player-controls-timeline">
                                  <div
                                    className="player-controls-timeline-playhead"
                                    style={{
                                      width: this.state.timelinePlayhead,
                                    }}
                                  />
                                </div>
                                {/* <div */}
                                {/*  id="forward-indicator" */}
                                {/*  className="player-controls-skip-indicator" */}
                                {/* > */}
                                {/*    <span className="player-controls-skip-symbol"> */}
                                {/*      +*/}
                                {/*    </span> */}
                                {/*  <span className="player-controls-skip-number"> */}
                                {/*      30 */}
                                {/*    </span> */}
                                {/*  <span className="player-controls-skip-text"> */}
                                {/*      s */}
                                {/*    </span> */}
                                {/* </div> */}
                                {/* <div */}
                                {/*  id="rewind-indicator" */}
                                {/*  className="player-controls-skip-indicator" */}
                                {/* > */}
                                {/*    <span className="player-controls-skip-symbol"> */}
                                {/*      -*/}
                                {/*    </span> */}
                                {/*  <span className="player-controls-skip-number"> */}
                                {/*      10 */}
                                {/*    </span> */}
                                {/*  <span className="player-controls-skip-text"> */}
                                {/*      s */}
                                {/*    </span> */}
                                {/* </div> */}
                              </div>
                              <div className="player-controls-timestamp-curtime">
                                {this.state.ytPlayerCurrentTime}
                              </div>
                              <div className="player-controls-timestamp-totaltime">
                                {this.state.ytPlayerDuration}
                              </div>
                              <div className="player-controls-content-title">
                                {this.state.playingVideo.snippet.title}
                              </div>
                            </div>
                          )}
                      </React.Fragment>
                    )}
                  {!this.state.playingVideo && (
                    <VideoList
                      previousSearches={previousSearches}
                      handleVideoSelect={this.handleVideoSelect}
                      onSearch={this.onSearch}
                      getMoreSearchResults={this.getMoreSearchResults}
                      videos={this.state.videos}
                    />
                  )}
                </Col>
                {this.state.fullscreen && (
                  <Col
                    style={{
                      padding: 0,
                      fontWeight: 'bolder',
                      height: '100rem',
                    }}
                    className="col-2 dark-theme-color"
                  >
                    <Queue enlarged noAvatars noControlButtons noOfflineStaff />
                  </Col>
                )}
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>
    );
  }
}

export default withStyles(s)(Tv);
