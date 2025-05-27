import { useRef, useState } from "react";
import {  Play, Pause, FastForward, Rewind } from "lucide-react";
import { motion } from "framer-motion";
import VideoTestimonial1 from "../assets/testimon-v-main1.mp4";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const Testimonials = () => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleSeek = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime += time;
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-100 via-cyan-100 to-emerald-100  px-8 rounded-3xl">
      <div className="max-w-7xl mx-auto">
        <motion.h1
          className="text-5xl md:text-7xl font-bold  text-center"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="bg-gradient-to-r from-cyan-800 to-emerald-800 bg-clip-text text-transparent">
            Guest
          </span>{" "}
          Experience
        </motion.h1>

        <div className="mt-32">
          <div className="max-w-5xl mx-auto relative rounded-[2rem] overflow-hidden shadow-2xl group">
            <video
              ref={videoRef}
              className="w-full aspect-video object-cover"
              src={VideoTestimonial1}
              onTimeUpdate={handleTimeUpdate}
            />
            <div
              className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 group-hover:bg-black/30 transition-all duration-500"
              onClick={toggleVideo}
            >
              <div
                className={`w-24 h-24 rounded-full bg-emerald-600/90 backdrop-blur-md flex items-center justify-center transition-all duration-500 hover:scale-110 hover:bg-emerald-600 ${
                  isPlaying ? "opacity-0 group-hover:opacity-100" : ""
                }`}
              >
                {isPlaying ? (
                  <Pause className="w-12 h-12 text-white" />
                ) : (
                  <Play className="w-12 h-12 text-white ml-2" />
                )}
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent">
              <div className="flex items-center justify-between">
                <button onClick={() => handleSeek(-10)} className="text-white">-10s</button>
                <button onClick={() => handleSeek(-30)} className="text-white"><Rewind className="w-6 h-6" /></button> {/* Rewind button */}
                <input
                  type="range"
                  value={progress}
                  onChange={(e) => {
                    const newTime = (e.target.value / 100) * videoRef.current.duration;
                    videoRef.current.currentTime = newTime;
                  }}
                  className="w-full mx-4"
                />
                <button onClick={() => handleSeek(30)} className="text-white"><FastForward className="w-6 h-6" /></button> {/* Fast forward button */}
                <button onClick={() => handleSeek(10)} className="text-white">+10s</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
