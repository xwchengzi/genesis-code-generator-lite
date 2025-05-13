
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Chapter, Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Spinner } from '@/components/ui/spinner';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, 
  ChevronLeft, ChevronRight, Settings, ArrowLeft
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const VideoPlayerPage: React.FC = () => {
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>();
  const { profile, hasValidAccess } = useAuth();
  const navigate = useNavigate();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [nextChapter, setNextChapter] = useState<Chapter | null>(null);
  const [prevChapter, setPrevChapter] = useState<Chapter | null>(null);
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If user doesn't have valid access, redirect to expired page
    if (!hasValidAccess) {
      navigate('/expired');
      return;
    }
    
    const fetchChapterDetails = async () => {
      if (!courseId || !chapterId) return;

      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch chapter details
        const { data: chapterData, error: chapterError } = await supabase
          .from('chapters')
          .select('*')
          .eq('id', chapterId)
          .single();
        
        if (chapterError) throw chapterError;
        setChapter(chapterData);
        
        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();
        
        if (courseError) throw courseError;
        setCourse(courseData);
        
        // Fetch all chapters in this course for navigation
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('*')
          .eq('course_id', courseId)
          .order('order_in_course');
        
        if (chaptersError) throw chaptersError;
        
        if (chaptersData) {
          const currentIndex = chaptersData.findIndex(c => c.id === parseInt(chapterId));
          
          if (currentIndex > 0) {
            setPrevChapter(chaptersData[currentIndex - 1]);
          } else {
            setPrevChapter(null);
          }
          
          if (currentIndex < chaptersData.length - 1) {
            setNextChapter(chaptersData[currentIndex + 1]);
          } else {
            setNextChapter(null);
          }
        }
        
        // Get video URL from storage
        if (chapterData) {
          const { data: videoData, error: videoError } = await supabase.storage
            .from('course_videos')
            .createSignedUrl(chapterData.video_storage_path, 3600); // 1 hour expiry
          
          if (videoError) throw videoError;
          
          if (videoData) {
            setVideoUrl(videoData.signedUrl);
          }
        }
      } catch (error: any) {
        console.error('Error fetching chapter details:', error);
        setError(error.message || '加载视频时出错');
        toast({
          title: '加载失败',
          description: error.message || '加载视频时出错',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChapterDetails();
  }, [courseId, chapterId, hasValidAccess, navigate]);

  useEffect(() => {
    // Record progress when video is loaded
    const recordProgress = async () => {
      if (!profile || !chapter) return;
      
      try {
        const { error } = await supabase
          .from('user_chapter_progress')
          .upsert({
            user_id: profile.id,
            chapter_id: chapter.id,
            watched_at: new Date().toISOString(),
          });
        
        if (error) throw error;
      } catch (error) {
        console.error('Error recording progress:', error);
      }
    };
    
    if (videoUrl) {
      recordProgress();
    }
  }, [videoUrl, profile, chapter]);

  // Video player controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const toggleMute = () => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };
  
  const handleVolumeChange = (value: number[]) => {
    if (!videoRef.current) return;
    
    const newVolume = value[0];
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
      videoRef.current.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
  };
  
  const handleTimeChange = (value: number[]) => {
    if (!videoRef.current) return;
    
    const newTime = value[0];
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    setCurrentTime(videoRef.current.currentTime);
  };
  
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    
    setDuration(videoRef.current.duration);
  };
  
  const handlePlay = () => {
    setIsPlaying(true);
  };
  
  const handlePause = () => {
    setIsPlaying(false);
  };
  
  const handlePlaybackRateChange = (rate: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };
  
  const toggleFullScreen = () => {
    if (!videoContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(err => {
        console.error('Could not enable fullscreen mode:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };
  
  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Show/hide controls on mouse movement
  const showControlsTemporarily = () => {
    setShowControls(true);
    
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };
  
  useEffect(() => {
    const container = videoContainerRef.current;
    
    if (container) {
      container.addEventListener('mousemove', showControlsTemporarily);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('mousemove', showControlsTemporarily);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      }
      
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/courses/${courseId}`} className="flex items-center">
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回课程
          </Link>
        </Button>
      </div>

      {/* Video title and info */}
      {chapter && course && (
        <div className="mb-4">
          <h1 className="text-2xl font-bold">{chapter.title}</h1>
          <p className="text-gray-600">{course.title}</p>
          {chapter.description && (
            <p className="mt-2 text-gray-600">{chapter.description}</p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
          <Spinner size="lg" className="text-white" />
        </div>
      ) : error ? (
        <div className="aspect-video bg-gray-900 rounded-lg flex flex-col items-center justify-center text-white p-4">
          <p className="text-red-400 mb-4">视频加载失败</p>
          <p className="text-sm text-gray-400 mb-6">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            重试
          </Button>
        </div>
      ) : (
        <>
          {/* Video Player */}
          <div 
            ref={videoContainerRef}
            className="relative aspect-video bg-black rounded-lg overflow-hidden"
            onMouseMove={showControlsTemporarily}
            onClick={togglePlay}
          >
            <video
              ref={videoRef}
              src={videoUrl || undefined}
              className="w-full h-full"
              autoPlay={false}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={handlePlay}
              onPause={handlePause}
              onEnded={() => {
                setIsPlaying(false);
                if (nextChapter) {
                  navigate(`/courses/${courseId}/chapters/${nextChapter.id}`);
                }
              }}
            />
            
            {/* Video Controls Overlay */}
            {showControls && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end" onClick={(e) => e.stopPropagation()}>
                {/* Progress bar */}
                <div className="px-4 pb-1">
                  <Slider
                    value={[currentTime]}
                    min={0}
                    max={duration}
                    step={0.1}
                    onValueChange={handleTimeChange}
                    className="cursor-pointer"
                  />
                </div>
                
                {/* Controls row */}
                <div className="flex items-center justify-between px-4 pb-4">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={togglePlay}
                      className="text-white hover:bg-white/20"
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </Button>
                    
                    <div className="flex items-center gap-1 w-28">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={toggleMute}
                        className="text-white hover:bg-white/20"
                      >
                        {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                      </Button>
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={handleVolumeChange}
                        className="cursor-pointer"
                      />
                    </div>
                    
                    <div className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-white hover:bg-white/20"
                        >
                          <Settings size={20} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem 
                          onClick={() => handlePlaybackRateChange(0.5)}
                          className={playbackRate === 0.5 ? "bg-blue-50" : ""}
                        >
                          0.5x
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handlePlaybackRateChange(1)}
                          className={playbackRate === 1 ? "bg-blue-50" : ""}
                        >
                          1.0x (正常)
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handlePlaybackRateChange(1.5)}
                          className={playbackRate === 1.5 ? "bg-blue-50" : ""}
                        >
                          1.5x
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handlePlaybackRateChange(2)}
                          className={playbackRate === 2 ? "bg-blue-50" : ""}
                        >
                          2.0x
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={toggleFullScreen}
                      className="text-white hover:bg-white/20"
                    >
                      <Maximize size={20} />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Chapter Navigation */}
          <div className="flex justify-between mt-6">
            <div>
              {prevChapter && (
                <Button asChild variant="outline">
                  <Link to={`/courses/${courseId}/chapters/${prevChapter.id}`} className="flex items-center">
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    上一章: {prevChapter.title}
                  </Link>
                </Button>
              )}
            </div>
            
            <div>
              {nextChapter && (
                <Button asChild>
                  <Link to={`/courses/${courseId}/chapters/${nextChapter.id}`} className="flex items-center">
                    下一章: {nextChapter.title}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoPlayerPage;
