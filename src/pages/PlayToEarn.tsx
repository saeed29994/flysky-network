import playImage from '../assets/play_to_earn.jpg';
import playImageMobile from '../assets/play_mobile.jpg';

const PlayToEarn = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-10">
      {/* صورة للموبايل */}
      <img
        src={playImageMobile}
        alt="Play to Earn Mobile"
        className="block md:hidden max-w-full h-auto rounded-xl shadow-xl border-4 border-yellow-400"
      />
      {/* صورة للديسكتوب */}
      <img
        src={playImage}
        alt="Play to Earn"
        className="hidden md:block max-w-full h-auto rounded-xl shadow-xl border-4 border-yellow-400"
      />
    </div>
  );
};

export default PlayToEarn;
