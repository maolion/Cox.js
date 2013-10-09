/*
 * ${project} < ${FILE} >
 *
 * @DATE    ${DATE}
 * @VERSION ${version}
 * @AUTHOR  ${author}
 * 
 * ----------------------------------------------------------------------------
 * 
 * ----------------------------------------------------------------------------
 * 实现参考的相关资料
 * http://www.cnblogs.com/pigtail/archive/2012/12/04/2719093.html
 * http://www.cnblogs.com/cloudgamer/archive/2009/01/06/Tween.html
 * http://www.cnblogs.com/_franky/archive/2010/04/30/1725390.html
 * http://baike.baidu.com/link?url=G_vmyH6_yB8j-03nHJRMtm2HRrD9uoOAcV792DQ-ls5kfGHkXap1OPR-ARnhqpRt
 */

Define( "Animation", Depend( "~/Cox/Env" ), function( require, Animation, module ){

    var 
        Env                = require( "Env" ),
        EMPTY_FUNCTION     = function(){},
        SLICE              = Array.prototype.slice,
        TIMER_MIN_INTERVAL = 10,
        DEFAULT_FPS        = Env.name === "ie" ? 65 : 45,
        UID = function(){
            var uid = new Date().getTime();
            return function( prefix ){
                return ( prefix || "" ) + uid++;
            };
        }()   
    ;
   
    Animation = Class( "Animation", Extends( Cox.EventSource ), function( Static, Public ){

        Static.Transition = {
            Linear: function(t, b, c, d) { return c * t / d + b; },
            Quad : {
                easeIn : function(t, b, c, d) {
                    return c * (t /= d) * t + b;
                },
                easeOut : function(t, b, c, d) {
                    return - c * (t /= d) * (t - 2) + b;
                },
                easeInOut : function(t, b, c, d) {
                    if ((t /= d / 2) < 1) return c / 2 * t * t + b;
                    return - c / 2 * ((--t) * (t - 2) - 1) + b;
                }
            },
            Cubic : {
                easeIn : function(t, b, c, d) {
                    return c * (t /= d) * t * t + b;
                },
                easeOut : function(t, b, c, d) {
                    return c * ((t = t / d - 1) * t * t + 1) + b;
                },
                easeInOut : function(t, b, c, d) {
                    if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
                    return c / 2 * ((t -= 2) * t * t + 2) + b;
                }
            },
            Quart : {
                easeIn : function(t,b,c,d){
                    return c*(t/=d)*t*t*t + b;
                },
                easeOut : function(t,b,c,d){
                    return -c * ((t=t/d-1)*t*t*t - 1) + b;
                },
                easeInOut : function(t,b,c,d){
                    if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
                    return -c/2 * ((t-=2)*t*t*t - 2) + b;
                }
            },
            Quint : {
                easeIn : function(t,b,c,d){
                    return c*(t/=d)*t*t*t*t + b;
                },
                easeOut : function(t,b,c,d){
                    return c*((t=t/d-1)*t*t*t*t + 1) + b;
                },
                easeInOut : function(t,b,c,d){
                    if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
                    return c/2*((t-=2)*t*t*t*t + 2) + b;
                }
            },
            Sine : {
                easeIn : function(t,b,c,d){
                    return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
                },
                easeOut : function(t,b,c,d){
                    return c * Math.sin(t/d * (Math.PI/2)) + b;
                },
                easeInOut : function(t,b,c,d){
                    return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
                }
            },
            Expo : {
                easeIn : function(t,b,c,d){
                    return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
                },
                easeOut : function(t,b,c,d){
                    return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
                },
                easeInOut : function(t,b,c,d){
                    if (t==0) return b;
                    if (t==d) return b+c;
                    if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
                    return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
                }
            },
            Circ : {
                easeIn : function(t,b,c,d){
                    return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
                },
                easeOut : function(t,b,c,d){
                    return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
                },
                easeInOut : function(t,b,c,d){
                    if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
                    return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
                }
            },
            Elastic : {
                easeIn : function(t,b,c,d,a,p){
                    if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
                    if (!a || a < Math.abs(c)) { a=c; var s=p/4; }
                    else var s = p/(2*Math.PI) * Math.asin (c/a);
                    return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
                },
                easeOut : function(t,b,c,d,a,p){
                    if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
                    if (!a || a < Math.abs(c)) { a=c; var s=p/4; }
                    else var s = p/(2*Math.PI) * Math.asin (c/a);
                    return (a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b);
                },
                easeInOut : function(t,b,c,d,a,p){
                    if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
                    if (!a || a < Math.abs(c)) { a=c; var s=p/4; }
                    else var s = p/(2*Math.PI) * Math.asin (c/a);
                    if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
                    return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
                }
            },
            Back : {
                easeIn : function(t,b,c,d,s){
                    if (s == undefined) s = 1.70158;
                    return c*(t/=d)*t*((s+1)*t - s) + b;
                },
                easeOut : function(t,b,c,d,s){
                    if (s == undefined) s = 1.70158;
                    return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
                },
                easeInOut : function(t,b,c,d,s){
                    if (s == undefined) s = 1.70158; 
                    if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
                    return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
                }
            },
            Bounce : function(){
                function easeIn( t, b, c, d ){
                    return c - easeOut(d-t, 0, c, d) + b;
                }
                function easeOut( t, b, c, d ){
                    if ((t/=d) < (1/2.75)) {
                        return c*(7.5625*t*t) + b;
                    } else if (t < (2/2.75)) {
                        return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
                    } else if (t < (2.5/2.75)) {
                        return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
                    } else {
                        return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
                    }
                }
                function easeInOut( t, b, c, d ){
                    if (t < d/2) return easeIn(t*2, 0, c, d) * .5 + b;
                    else return easeOut(t*2-d, 0, c, d) * .5 + c*.5 + b;
                }
                return {
                    easeIn    : easeIn,
                    easeOut   : easeOut,
                    easeInOut : easeInOut
                }
            }()
        };

        function nextFrame( frame, frames, anima ){

            var event = null;

            if( frame > frames ){
                clearInterval( anima._timer );

                anima._timer         = null;
                anima._play_clips    = null;
                anima._played_clips  = {};
                anima._current_frame = 0;

                event = anima.getEvent( "done" );
                event.frames       = frames;
                event.currentFrame = frame;
                anima.fireEvent( "done", [ event ] );
                return;
            }

            event = anima.getEvent( "enterFrame" );
            event.frames       = frames;
            event.currentFrame = frame;
            anima.fireEvent( "enterFrame", [ event ] );
            anima._play_clips = XList.filter( anima._play_clips, function( clip ){
                var 
                    clipName = clip.clipName,
                    values   = null
                ;
                if( clip.startFrame <= frame && clip.endFrame >= frame ){
                    if( !( clipName in anima._played_clips ) ){
                        anima._played_clips[ clipName ] = clip;
                        event = anima.getEvent( "enterClip" );
                        event.frames       = frames;
                        event.currentFrame = frame;
                        event.clipName     = clipName;
                        anima.fireEvent( "enterClip", [ event ] );
                    }

                    //计算变化值
                    values = {};
                    for( var i = 0, l = clip.options.length; i < l; i++ ){
                        var option = clip.options[i];
                        values[ option.key ] = option.transition(
                            frame - clip.startFrame, 
                            option.from, 
                            option.to - option.from, 
                            clip.endFrame - clip.startFrame
                        );
                    }
                    clip.handler.call( anima, values, clipName );
                }
                if( clip.endFrame <= frame ){
                    event = anima.getEvent( "leaveClip" );
                    event.frames       = frames;
                    event.currentFrame = frame;
                    event.clipName     = clipName;
                    anima.fireEvent( "leaveClip", [ event ] );
                    return false;
                }
                return true;
            } );
        }

        function computeFrames( clips, fps ){
            var maxTime = 0;
            XObject.forEach( clips, true, function( clip ){
                if( clip.endTime > maxTime ){
                    maxTime = clip.endTime;
                }
            } );
            //计算出动画的总帧数
            return Math.ceil( maxTime / 1000 * fps );
        }

        Public.constructor = XFunction( 
            Optional( Number, DEFAULT_FPS ), Optional( Function, Static.Transition.Linear ), function( fps, transition ){
                this.Super( "constructor" );

                this.dispatchEvent(
                    new Cox.Event( "start", { target : this } ),
                    new Cox.Event( "done", { target : this } ),
                    new Cox.Event( "play", { target : this } ),
                    new Cox.Event( "stop", { target : this } ),
                    new Cox.Event( "enterFrame", { target : this } ),
                    new Cox.Event( "enterClip", { target : this } ),
                    new Cox.Event( "leaveClip", { target : this } )
                );

                this._clips              = {};
                this._fps                = fps;
                this._interval           = Math.max( 1000 / fps, TIMER_MIN_INTERVAL );
                this._frames             = 0;
                this._timer              = null;
                this._play_clips         = null;
                this._played_clips       = {};
                this._current_frame      = 0;
                this._default_transition = transition;
            }
        );

        Public.addClip = XFunction( 
            Optional( String ), Optional( Number, 0 ),  Number, Array, Function,
            function( clipName, startTime, endTime, options, handler ){
                var 
                    _this = this,
                    clip  = null
                ;
                
                clipName  = clipName || UID( "CLIP" );
                startTime = ~~Math.max( startTime, 0 );
                endTime   = ~~Math.max( endTime, 0 );
                clip      = this._clips[ clipName ] = {
                    startTime  : startTime,
                    endTime    : endTime,
                    startFrame : Math.ceil(  startTime / 1000 * this._fps ),
                    endFrame   : Math.ceil( endTime / 1000 * this._fps ),
                    clipName   : clipName,
                    handler    : handler,
                    options    : XList.map( options, function( option ){
                        if( !( option.transition instanceof Function ) ){
                            option.transition = _this._default_transition;
                        }
                        option.from = parseFloat( option.from || 0 );
                        option.to   = parseFloat( option.to || 0 );
                        //option.
                        return option;
                    } )
                };  

                this._frames = computeFrames( this._clips, this._fps );
                this._play_clips && this._play_clips.push( clip );
                delete this._played_clips[ clipName ];
                return clipName;
            }
        );

        Public.removeClip = XFunction( String, function( clipName ){
            delete this._clips[ clipName ];
            delete this._played_clips[ clipName ];
        } );

        Public.removeClip.define( 
            Optional( Number, 0 ), Number, function( startTime, endTime ){
                var
                    _this = this,
                    clips = this._clips
                ;
                startTime = ~~( Math.max( startTime, 0 ) );
                endTime   = ~~( Math.max( endTime, 0 ) );
                XObject.forEach( clips, true, function( clip, key ){
                    if( clip.startTime >= startTime && clip.endTime <= endTime ){
                        delete clips[ key ];
                        delete _this._played_clips[ key ];
                    }
                } );
            } 
        );

        Public.removeAllClip = function(){
            this._clips         = {};
            this._frames        = 0;
            this._current_frame = 0;
            this._played_clips  = {};
            this._play_clips    = null;
        };

        Public.play = function(){
            var 
                anima      = this,
                event      = null
            ;

            if( anima._timer !== null ){
                return;
            }

            if( anima._current_frame === 0 ){
                event = anima.getEvent( "start" );
                event.currentFrame = 0;
                anima.fireEvent( "start", [ event ] );
            }

            anima._play_clips === null && this.resetPlayClips();

            event = anima.getEvent( "play" );
            event.currentFrame = anima._current_frame;
            anima.fireEvent( "play", [ event ] );
            
            anima._timer = setInterval( function(){
                nextFrame( 
                    ++anima._current_frame, 
                    anima._frames, 
                    anima
                );
            }, anima._interval );
        };

        Public.stop = function(){
            if( this._timer ){
                clearInterval( this._timer );
                var event = this.getEvent( "stop" );
                event.currentFrame = this._current_frame;
                this.fireEvent( "stop", [ event ] );
            }
        };

        Public.exit = function(){
            clearInterval( this._timer );
            this._timer = null;
            this._played_clips = {};
            this.resetPlayClips();
            nextFrame( 
                this._current_frame = this._frames, 
                this._frames,
                this
            );
            nextFrame( 
                ++this._current_frame, 
                this._frames,
                this
            );
            
        };

        Public.restart = function(){
            this._played_clips = {};
            this.resetPlayClips();
            this._current_frame = 0;
            this.play();
        };

        Public.next = function( noreset ){
            clearInterval( this._timer );
            if( !noreset ){
                this._played_clips = {};            
                this.resetPlayClips();
            }
            nextFrame( ++this._current_frame, this._frames, this );
        };

        Public.prev = function( noreset ){
            clearInterval( this._timer );
            if( !noreset ){
                this._played_clips = {};            
                this.resetPlayClips();
            }
            nextFrame( ++this._current_frame, this._frames, this );
        };

        Public.jump = XFunction( 
            String, Optional( Boolean ), function( clipName, play ){
                var clip = null;
                clip = this._clips[ clipName ];
                if( !clip ){
                    return;
                }
                clearInterval( this._timer );
                this._timer = null;
                this._played_clips = {};
                this.resetPlayClips();
                nextFrame( 
                    this._current_frame = clip.startFrame, 
                    this._frames,
                    this
                );
                play && this.play();
            }
        );

        Public.jump.define( 
            Number, Optional( Boolean ), function( frame, play ){
                clearInterval( this._timer );
                this._timer = null;
                this._played_clips = {};
                this.resetPlayClips();
                nextFrame( 
                    this._current_frame = Math.max( ~~frame, 0 ), 
                    this._frames,
                    this
                );
                play && this.play();
            }
        );

        Public.resetPlayClips = function(){
            var anima = this;
            anima._play_clips = [];
            XObject.forEach( anima._clips, true, function( clip, clipName ){
                if( !anima._played_clips.hasOwnProperty( clipName ) 
                 && anima._current_frame <= clip.endFrame
                ){
                    anima._play_clips.push( clip );                        
                }
            } );
        };

        Public.playing = function(){
            return this._timer !== null;
        }

        Public.stopped = function(){
            return this._timer === null;
        };

        Public.getFrames = function(){
            return this._frames;
        };

        Public.getCurrentFrame = function(){
            return this._current_frame;
        };

    } );

    module.exports = Animation;
} );
