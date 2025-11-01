import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

const ReferralBonusButton = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [bonusReady, setBonusReady] = useState(false);
  const [verifiedReferrals, setVerifiedReferrals] = useState<any[]>([]);

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
          
          // Check both the referralBonusReady flag and the referral list
          const directBonusFlag = data.referralBonusReady === true;
          
          // Check for unclaimed verified referrals
          const referralList = data.referralList || [];
          const verified = referralList.filter((ref: any) => 
            ref.status === 'Verified' && !ref.claimed
          );
          
          setVerifiedReferrals(verified);
          
          // Set bonus ready if either direct flag is true or there are unclaimed verified referrals
          setBonusReady(directBonusFlag || verified.length > 0);
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
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) return;
      
      const userData = userSnap.data();
      const referralList = userData.referralList || [];
      const currentBalance = userData.balance || 0;
      
      // Find unclaimed verified referrals
      const unclaimedIndex = referralList.findIndex((ref: any) => 
        ref.status === 'Verified' && !ref.claimed
      );
      
      if (unclaimedIndex === -1) {
        toast.error(t("referralBonus.noBonusAvailable"));
        return;
      }
      
      // Calculate bonus amount based on tier
      const verifiedCount = referralList.filter((r: any) => r.status === 'Verified' && r.claimed).length;
      let bonusAmount = 0;
      if (verifiedCount < 10) bonusAmount = 100;
      else if (verifiedCount < 20) bonusAmount = 200;
      else bonusAmount = 300;
      
      // Get the approved user's ID before modifying the list
      const approvedUserId = referralList[unclaimedIndex].uid; 

      // Update the specific referral as claimed
      referralList[unclaimedIndex].claimed = true;
      
      await updateDoc(userRef, {
        referralList,
        balance: currentBalance + bonusAmount,
        referralBonusReady: verifiedReferrals.length > 1 // Keep flag true if there are more to claim
      });

      // Now, update the kycApprovalLogs collection
      if (approvedUserId) {
        const logsRef = collection(db, "kycApprovalLogs");
        const q = query(logsRef, 
          where("referrerId", "==", user.uid),
          where("approvedUserId", "==", approvedUserId),
          where("claimed", "==", false)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const logDoc = querySnapshot.docs[0];
          await updateDoc(logDoc.ref, {
            claimed: true,
            claimTimestamp: new Date(),
          });
        }
      }

      toast.success(t("referralBonus.claimedSuccess"));
      
      // Update local state
      if (verifiedReferrals.length <= 1) {
        setBonusReady(false);
      }
      setVerifiedReferrals(prev => prev.filter((_, i) => i !== 0));
    } catch (error) {
      console.error("Error claiming referral bonus:", error);
      toast.error(t("referralBonus.claimedError"));
    }
  };

  if (loading) return <p>{t("referralBonus.loading")}</p>;

  return bonusReady ? (
    <button
      onClick={handleClaimBonus}
      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:transform-none text-lg"
    >
      🎁 {t("referralBonus.claimButton")} ({verifiedReferrals.length})
    </button>
  ) : (
    <p>{t("referralBonus.noBonus")}</p>
  );
};

export default ReferralBonusButton;
