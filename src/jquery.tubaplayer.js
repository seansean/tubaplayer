/** TubaPlayer YouTube Video Player **/
;(function($, doc, win) {
	"use strict";

	var name = 'tubaplayer';

	function TubaPlayer(el, opts) {
		this.$el                = $(el);
		this.player             = null;
		this.$videoContainer    = null;
		this.videoId            = null;
		this.$videoNav          = null;

		// Set defaults
		this.defaults = {
			width:  640,
			height: 480
		};

		var meta        = this.$el.data(name + '-opts');
		this.opts       = $.extend(this.defaults, opts, meta);
		
		this.$el.data(name, this);

		this.init();
	}

	// Init
	TubaPlayer.prototype.init = function() {
		var self = this;
		
		this.$el.addClass(name).css({'width': self.opts.width});
		
		// Build video container
		var videoContainerHTML = $('<div class="'+ name +'-container" style="width:'+ this.opts.width +'px; height:'+ this.opts.height +'px;"></div>');      
		this.$el.append(videoContainerHTML);
		this.$videoContainer = this.$el.find('.'+ name +'-container');
		this.$videoContainer.attr('id', 'ui-id-' + Math.round(new Date().getTime() + (Math.random() * 100)));
		
		// Build nav container
		if ($(this.opts.navId).length) {
			self.$videoNav = $(this.opts.navId).addClass(name + '-nav');
		} else {
			self.$videoNav = $('<div id="'+ this.opts.navId +'" class="'+ name +'-nav"></div>');
		}
		self.$el.append(self.$videoNav);

		// Embed YouTube API
		var tag = document.createElement('script');
		tag.src = 'http://www.youtube.com/player_api';
		var firstScriptTag = document.getElementsByTagName('script')[0];
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

		// After the API code downloads.
		window.onYouTubePlayerAPIReady = function() {
			self.getPlaylist();
		};
	};

	// Get playlist data
	TubaPlayer.prototype.getPlaylist = function() {
		var self = this;

		var playListURL         = 'http://gdata.youtube.com/feeds/api/playlists/'+ self.opts.playlistId +'?v=2&alt=json&callback=?';

		$.getJSON(playListURL, function(data) {
			var list_data       = $('<ul></ul>');
			var i = 0;
			$.each(data.feed.entry, function(i, item) {
				var feedTitle   = item.title.$t;
				var feedURL     = item.link[1].href;
				var fragments   = feedURL.split('/');
				var videoId     = fragments[fragments.length - 2];
				var thumb       = 'http://img.youtube.com/vi/'+ videoId +'/default.jpg';
				var is_selected = (i == 0 ? ' selected' : '');
				var list_item 	= $('<li><div class="video-button'+ is_selected +'" data-video-id="'+ videoId +'" title="'+ feedTitle +'"><img src="'+ thumb +'" alt="'+ feedTitle +'"></div></li>').appendTo(list_data);
						
				if (!i) {
					self.opts.videoId = videoId;
				}

				i++;
			});

			$(list_data).appendTo(self.$videoNav);

			// Video nav button click
			$('.video-button').click(function(){
				var id = $(this).data('video-id');
				self.$el.data(name).updateVideo(id);
			});

			self.loadVideo();
		});
	};

	// Inititalize YouTube player
	TubaPlayer.prototype.loadVideo = function() {
		var self = this;

		self.player = new YT.Player(self.$videoContainer.attr('id'), {
			width:      self.opts.width,
			height:     self.opts.height,
			playerVars: {
				controls:           1,
				listType:   		'playlist',
				list:       		self.opts.playlistId,
				loop:       		1,
				modestbranding:     1,
				rel: 				0,
				showinfo:           0,
				wmode:              'transparent'
			},
			events: {
				'onReady':                  _onPlayerReady,
				'onStateChange':            function(event) { _onPlayerStateChange(event, self); }
			}
		});
	};


	/**
	 * Controls
	 */
	// Update with new video by ID
	TubaPlayer.prototype.updateVideo = function(videoId) {
		var self = this;
		if (videoId != self.videoId) {
			self.videoId = videoId;
			self.player.loadVideoById(self.videoId);
			self.updateVideoNav(self.videoId);
		}
	};

	// Pause the currently playing video
	TubaPlayer.prototype.pauseVideo = function() {
		this.player.pauseVideo();
	};
	// Play the currently playing video
	TubaPlayer.prototype.playVideo = function() {
		this.player.playVideo();
	};


	/**
	 * Event Handlers
	 */
	// On player ready
	function _onPlayerReady(event) {}

	// On state change
	function _onPlayerStateChange(event, player) {
		var self = player;
		//console.log(event.target.getPlaylist());

		// Get current video ID
		var url 	= event.target.getVideoUrl();
		var match 	= url.match(/[?&]v=([^&]+)/);
		var videoId = match[1];



		// Check if video has changed
		if (videoId != self.videoId) {
			self.videoId = videoId;
			self.updateVideoNav(self.videoId);
		}
	}

	// Update the video player nav
	TubaPlayer.prototype.updateVideoNav = function(videoId) {
		var self = this;
		self.$videoNav.find('div').removeClass('selected');
		self.$videoNav.find('[data-video-id="'+ videoId +'"]').addClass('selected');
	};

	// Destroy the plugin
	TubaPlayer.prototype.destroy = function() {
		this.$el.off('.' + name);
		this.$el.find('*').off('.' + name);

		this.$el.removeData(name);
		this.$el = null;
	};

	// Start
	$.fn.tubaPlayer = function(opts) {
		return this.each(function() {
			new TubaPlayer(this, opts);
		});
	};

})(jQuery, document, window);