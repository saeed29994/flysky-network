// 📁 src/pages/AboutUs.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "./DashboardLayout";

const AboutUs: React.FC = () => {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <section id="about" className="bg-[#0D1B2A] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-yellow-400 mb-6">{t("about.title")}</h2>

          <p className="text-lg mb-4">{t("about.intro")}</p>

          <div className="my-10">
            <h3 className="text-3xl font-bold text-yellow-400 mb-4">{t("about.visionTitle")}</h3>
            <p className="text-lg mb-4">{t("about.vision")}</p>

            <h3 className="text-3xl font-bold text-yellow-400 mb-4">{t("about.missionTitle")}</h3>
            <p className="text-lg mb-4">{t("about.mission")}</p>
          </div>

          <p className="text-lg mb-4">{t("about.featuresTitle")}</p>
          <ul className="list-disc list-inside text-left max-w-md mx-auto mb-6">
            <li>{t("about.features.mining")}</li>
            <li>{t("about.features.staking")}</li>
            <li>{t("about.features.gaming")}</li>
            <li>{t("about.features.nft")}</li>
          </ul>

          <div className="my-10 text-left">
            <h3 className="text-3xl font-bold text-yellow-400 mb-4 text-center">{t("about.whitepaper.title")}</h3>
            <p className="text-lg mb-4">{t("about.whitepaper.overview")}</p>

            <h4 className="text-2xl font-semibold text-yellow-400 mb-2">{t("about.whitepaper.introTitle")}</h4>
            <p className="text-lg mb-4">{t("about.whitepaper.intro")}</p>

            <h4 className="text-2xl font-semibold text-yellow-400 mb-2">{t("about.whitepaper.tokenTitle")}</h4>
            <p className="text-lg mb-4">{t("about.whitepaper.tokenIntro")}</p>
            <p className="text-lg mb-4">{t("about.whitepaper.phase")}</p>
            <p className="text-lg mb-4">{t("about.whitepaper.mainSale")}</p>
            <p className="text-lg mb-4">{t("about.whitepaper.uses")}</p>

            <h4 className="text-2xl font-semibold text-yellow-400 mb-2">{t("about.whitepaper.gameTitle")}</h4>
            <p className="text-lg mb-4">{t("about.whitepaper.gameIntro")}</p>
            <p className="text-lg mb-4">{t("about.whitepaper.gameDetails")}</p>
            <p className="text-lg mb-4">{t("about.whitepaper.gameFeaturesTitle")}</p>
            <ul className="list-disc list-inside mb-4">
              <li>{t("about.whitepaper.features.vehicles")}</li>
              <li>{t("about.whitepaper.features.theft")}</li>
              <li>{t("about.whitepaper.features.maintenance")}</li>
              <li>{t("about.whitepaper.features.base")}</li>
              <li>{t("about.whitepaper.features.auctions")}</li>
              <li>{t("about.whitepaper.features.roles")}</li>
            </ul>
            <p className="text-lg mb-4">{t("about.whitepaper.status")}</p>

            <h4 className="text-2xl font-semibold text-yellow-400 mb-2">{t("about.whitepaper.roadmap")}</h4>
            <p className="text-lg mb-4">{t("about.whitepaper.roadmapDesc")}</p>

            <h4 className="text-2xl font-semibold text-yellow-400 mb-2">{t("about.whitepaper.security")}</h4>
            <p className="text-lg mb-4">{t("about.whitepaper.securityDesc")}</p>

            <h4 className="text-2xl font-semibold text-yellow-400 mb-2">{t("about.whitepaper.conclusion")}</h4>
            <p className="text-lg mb-4">{t("about.whitepaper.conclusionDesc")}</p>
          </div>

          <p className="text-lg text-yellow-400 font-semibold mb-6">{t("about.join")}</p>
        </div>
      </section>
    </DashboardLayout>
  );
};

export default AboutUs;
