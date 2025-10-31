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
        balance: 1000, // adjust or add logic
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
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
    >
      🎁 {t("referralBonus.claimButton")}
    </button>
  ) : (
    <p>{t("referralBonus.noBonus")}</p>
  );
};

export default ReferralBonusButton;
