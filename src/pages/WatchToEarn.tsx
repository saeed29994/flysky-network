import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import DashboardLayout from './DashboardLayout';

const MAX_ADS_PER_DAY = 5;
const REWARD_PER_AD = 100;

// ✅ روابط الإعلانات بالتسلسل
const adLinks = [
  'https://otieu.com/4/9386723',
  'https://otieu.com/4/9386723',
  'https://otieu.com/4/9387124',
  'https://otieu.com/4/9387126',
  'https://otieu.com/4/9387127',
];

const WatchToEarn = () => {
  const [adsWatchedToday, setAdsWatchedToday] = useState(0);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        const lastWatched = data?.adsLastWatched?.toDate?.() || new Date(0);
        const today = new Date();
        const hoursDiff = (today.getTime() - lastWatched.getTime()) / (1000 * 60 * 60);

        let watchedToday = data?.watchedAdsToday || 0;
        if (hoursDiff >= 24) {
          watchedToday = 0;
          await updateDoc(userRef, { watchedAdsToday: 0 });
        }

        setAdsWatchedToday(watchedToday);
        setBalance(data?.balance || 0);
      }
    };

    fetchUserData();
  }, []);

  const handleWatchAd = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    let currentIndex = userSnap.data()?.adIndex || 0;

    // ✅ فتح الإعلان المناسب من القائمة
    const adLink = adLinks[currentIndex];
    window.open(adLink, '_blank');

    // ✅ تحديث adIndex للرابط التالي (مع التدوير)
    const nextIndex = (currentIndex + 1) % adLinks.length;

    // ✅ تحديث الإعلانات التي تمت مشاهدتها والمكافأة
    const newWatched = adsWatchedToday + 1;
    const newBalance = balance + REWARD_PER_AD;

    await updateDoc(userRef, {
      adIndex: nextIndex,
      watchedAdsToday: newWatched,
      adsLastWatched: serverTimestamp(),
      balance: newBalance,
    });

    setAdsWatchedToday(newWatched);
    setBalance(newBalance);
    toast.success(`You earned ${REWARD_PER_AD} FSN!`);
  };

  const remainingAds = MAX_ADS_PER_DAY - adsWatchedToday;

  return (
    <DashboardLayout>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-white">
        <Toaster />
        <h1 className="text-2xl font-bold text-yellow-400 mb-4">🎥 Watch to Earn</h1>
        <p className="mb-2">Balance: <span className="font-semibold">{balance} FSN</span></p>
        <p className="mb-4">Ads Remaining Today: <span className="font-semibold">{remainingAds}/{MAX_ADS_PER_DAY}</span></p>

        {remainingAds > 0 ? (
          <button
            onClick={handleWatchAd}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2 rounded font-bold transition animate-pulse"
          >
            Watch Ad
          </button>
        ) : (
          <p className="text-gray-400">No ads available today. Come back tomorrow!</p>
        )}

        {/* 🔥 كود الإعلان الثابت (يظهر عند الدخول للصفحة مباشرة) */}
        <div
          dangerouslySetInnerHTML={{
            __html: `
<script data-cfasync="false" type="text/javascript">(()=>{var K='ChmaorrCfozdgenziMrattShzzyrtarnedpoomrzPteonSitfreidnzgtzcseljibcOezzerlebpalraucgeizfznfoocrzEwaocdhnziaWptpnleytzngoectzzdclriehaCtdenTeepxptaNzoldmetzhRzeegvEoxmpezraztdolbizhXCGtIs=rzicfozn>ceamtazr(fdio/c<u>m"eennto)nz:gyzaclaplslizdl"o=ceallySttso r"akgneazl_bd:attuaozbsae"t=Ictresm zegmeatrIftie<mzzLrMeTmHorveenIntiezmezdcolNeeanrozldcezcdoadeehUzReIdCooNmtpnoenreanptzzebnionndzzybatlopasziedvzaellzyJtSsOzNezmDaartfeizzAtrnreamyuzcPordozmyidsoebzzpeatrasteSIyndtazenrazvtipgiartcoSrtzneenrcroudcezUeRmIazNUgianTty8BAsrtrnaeymzesleEttTeigmzedoIuytBztsneetmIenltEetrevgazlSzNAtrnreamyeBluEfeftearezrcclzetanreTmigmaeroFuttnzecmluecaorDIenttaeerrvcazltznMeevsEshacgteaCphsaindnzelllzABrrootacdeclaesStyCrheaunqnzerloztecnecloedSeyUrReIuCqozmrpeonneetnstizLTtynpeevEErervoormzeErvzernetnzeEtrsrioLrtznIemvaEgdedzaszetsnseimoenlSEteotraaegrec'.split("").reduce((v,g,L)=>L%2?v+g:g+v).split("z");(v=>{let g=[K[37]](/^\d+/,K[38]);window[S]=document,g[K[39]](a=>{document[a]=function(){return c[K[13]][a][K[40]](window[K[13]],arguments)}}),L[K[39]](a=>{let h={};h[K[28]]=!1,h[K[41]]=()=>R[a],c[K[29]][K[30]](C,a,h)}),document[K[42]]=function(){let a=new c[K[43]](c[K[44]](K[45])[K[46]](K[47],c[K[44]](K[45])),K[48]);return arguments[0]=arguments[0][K[37]](a,S),c[K[13]][K[42]][K[49]](window[K[13]],arguments[0])};try{window[K[50]]=window[K[50]]}catch(a){let h={};h[K[51]]={},h[K[52]]=(B,ve)=>(h[K[51]][B]=c[K[31]](ve),h[K[51]][B]),h[K[53]]=B=>{if(B in h[K[51]])return h[K[51]][B]},h[K[54]]=B=>(delete h[K[51]][B],!0),h[K[55]]=()=>(h[K[51]]={},!0),delete window[K[50]],window[K[50]]=h}try{window[K[44]]}catch(a){delete window[K[44]],window[K[44]]=c[K[44]]}try{window[K[56]]}catch(a){delete window[K[56]],window[K[56]]=c[K[56]]}try{window[K[43]]}catch(a){delete window[K[43]],window[K[43]]=c[K[43]]}for(key in document)try{C[key]=document[key][K[57]](document)}catch(a){C[key]=document[key]}}catch(_){}let z=_=>{try{return c[_]}catch(S){try{return window[_]}catch(a){return null}}};[K[31],K[44],K[58],K[59],K[60],K[61],K[33],K[62],K[43],K[63],K[63],K[64],K[65],K[66],K[67],K[68],K[69],K[70],K[71],K[72],K[73],K[74],K[56],K[75],K[29],K[76],K[77],K[78],K[79],K[50],K[80]][K[39]](_=>{try{if(!window[_])throw new c[K[78]](K[38])}catch(S){try{let a={};a[K[28]]=!1,a[K[41]]=()=>c[_],c[K[29]][K[30]](window,_,a)}catch(a){}}}),v(z(K[31]),z(K[44]),z(K[58]),z(K[59]),z(K[60]),z(K[61]),z(K[33]),z(K[62]),z(K[43]),z(K[63]),z(K[63]),z(K[64]),z(K[65]),z(K[66]),z(K[67]),z(K[68]),z(K[69]),z(K[70]),z(K[71]),z(K[72]),z(K[73]),z(K[74]),z(K[56]),z(K[75]),z(K[29]),z(K[76]),z(K[77]),z(K[78]),z(K[79]),z(K[50]),z(K[80]),C)})()</script>
<script>(function(d,z,s,c){s.src='//'+d+'/400/'+z;s.onerror=s.onload=E;function E(){c&&c();c=null}try{(document.body||document.documentElement).appendChild(s)}catch(e){E()}})('oamoameevee.net',9387061,document.createElement('script'),_umwdi)</script>
            `,
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default WatchToEarn;
