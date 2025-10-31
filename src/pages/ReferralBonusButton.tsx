// src/components/ReferralBonusButton.tsx
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

const ReferralBonusButton = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [bonusReady, setBonusReady] = useState(false);

  useEffect(() => {
    const fetchBonusStatus = async () => {
      setLoading(true);
      try {
        const user = getAuth().currentUser;
        if (!user) return;

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setBonusReady(data.referralBonusReady === true);
        }
      } catch (error) {
        console.error("Error fetching referral bonus status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBonusStatus();
  }, []);

  const handleClaimBonus = async () => {
    try {
      const user = getAuth().currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);

      await updateDoc(userRef, {
        balance: 1000,
        referralBonusReady: false,
      });

      toast.success(t("referralBonus.claimedSuccess"));
      setBonusReady(false);
    } catch (error) {
      console.error("Error claiming referral bonus:", error);
      toast.error(t("referralBonus.claimedError"));
    }
  };

  if (loading) return <p>{t("referralBonus.loading")}</p>;

  return bonusReady ? (
 <button
  onClick={handleClaimBonus}
  className="relative inline-flex items-center justify-center px-6 py-2 font-semibold text-white rounded-full bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 shadow-md hover:from-green-600 hover:via-green-700 hover:to-emerald-700 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
>
  🎁 {t("referralBonus.claimButton")}
</button>
  ) : (
    <p>{t("referralBonus.noBonus")}</p>
  );
};

export default ReferralBonusButton;
