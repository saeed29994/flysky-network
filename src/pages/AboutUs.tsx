// 📁 src/pages/AboutUs.tsx
import React from "react";
import DashboardLayout from "./DashboardLayout";

const AboutUs: React.FC = () => {
  return (
    <DashboardLayout>
      <section id="about" className="bg-[#0D1B2A] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-yellow-400 mb-6">About Us</h2>
          <p className="text-lg mb-4">
            <strong>FlySky Network</strong> is a next-generation digital economy
            platform that merges{" "}
            <span className="text-yellow-400 font-semibold">
              mining, staking, gaming, and NFTs
            </span>{" "}
            into one seamless experience. We’re dedicated to building a vibrant
            ecosystem where users can earn, trade, and grow their assets while
            enjoying a gamified experience.
          </p>

          <div className="my-10">
            <h3 className="text-3xl font-bold text-yellow-400 mb-4">
              Our Vision
            </h3>
            <p className="text-lg mb-4">
              To become the world’s most engaging and rewarding digital economy
              platform, empowering users globally to thrive in the evolving
              digital landscape.
            </p>

            <h3 className="text-3xl font-bold text-yellow-400 mb-4">
              Our Mission
            </h3>
            <p className="text-lg mb-4">
              We aim to bridge the gap between traditional finance and the
              digital world by offering accessible mining, fair staking,
              immersive gaming, and a dynamic NFT marketplace.
            </p>
          </div>

          <p className="text-lg mb-4">Our platform features:</p>
          <ul className="list-disc list-inside text-left max-w-md mx-auto mb-6">
            <li>
              <strong>Mining</strong>: Start earning FSN tokens through our
              energy-efficient proof-of-activity model.
            </li>
            <li>
              <strong>Staking</strong>: Stake your FSN and watch your digital
              assets grow while supporting the network.
            </li>
            <li>
              <strong>Gaming</strong>: Enjoy thrilling games that reward your
              skills with real digital assets.
            </li>
            <li>
              <strong>NFT Marketplace</strong>: Trade unique NFTs and unlock
              exclusive in-game items and collectibles.
            </li>
          </ul>

          {/* Whitepaper Section */}
          <div className="my-10 text-left">
            <h3 className="text-3xl font-bold text-yellow-400 mb-4 text-center">
              Whitepaper
            </h3>
            <p className="text-lg mb-4">
              Our whitepaper is a comprehensive document that outlines the core
              philosophy, architecture, and future of FlySky Network. Here’s an
              overview:
            </p>

            <h4 className="text-2xl font-semibold text-yellow-400 mb-2">
              1. Introduction
            </h4>
            <p className="text-lg mb-4">
              FlySky Network is designed to revolutionize the way users interact
              with digital assets by combining mining, staking, gaming, and NFT
              marketplaces into a single ecosystem.
            </p>

            <h4 className="text-2xl font-semibold text-yellow-400 mb-2">
              2. FSN Token
            </h4>
            <p className="text-lg mb-4">
              <strong>FSN</strong> is the native utility token that powers the
              entire FlySky Network ecosystem. It serves as the backbone of all
              interactions within the platform.
            </p>
            <p className="text-lg mb-4">
              <strong>Current Phase:</strong> We are in a preparatory phase,
              offering a private sale for early supporters to acquire FSN tokens
              before the official launch.
            </p>
            <p className="text-lg mb-4">
              <strong>Main Sale:</strong> The official Initial Coin Offering
              (ICO) for FSN is scheduled to begin six months after the
              platform’s launch. During this period, FSN tokens will be minted
              and distributed to a wider audience, ensuring fair access to
              everyone interested in joining our growing ecosystem.
            </p>
            <p className="text-lg mb-4">
              FSN tokens will be used for mining rewards, staking, in-game
              purchases, NFT trading, and more.
            </p>

            <h4 className="text-2xl font-semibold text-yellow-400 mb-2">
              3. Battle Legend - Our Flagship Metaverse Game
            </h4>
            <p className="text-lg mb-4">
              As part of our commitment to delivering exceptional gaming
              experiences, we will launch one of the most advanced metaverse
              survival games: <strong>Battle Legend</strong>.
            </p>
            <p className="text-lg mb-4">
              <strong>Battle Legend</strong> is a survive-to-earn and
              burn-to-upgrade blockchain-based game. Players can build their
              bases, collect resources, and engage in thrilling battles, with a
              focus on both fun and economic sustainability.
            </p>
            <p className="text-lg mb-4">Key features include:</p>
            <ul className="list-disc list-inside mb-4">
              <li>
                Customizable vehicles, including sea and air combat vehicles, as
                NFTs.
              </li>
              <li>Vehicle theft and salvage system.</li>
              <li>
                Vehicle maintenance and mandatory repair mechanics — neglecting
                repairs can lead to vehicle destruction.
              </li>
              <li>
                Base building with gradual upgrades tied to the main base level.
              </li>
              <li>
                Periodic limited-edition vehicle auctions and rental options for
                rare vehicles.
              </li>
              <li>
                Two player types: Warriors and Traders, each with unique roles
                and risks.
              </li>
            </ul>
            <p className="text-lg mb-4">
              <strong>Current Status:</strong> The game is in the preparatory
              phase, with a private presale of in-game NFTs and vehicles
              planned. The main development will kick off after the ICO funds
              are secured, ensuring a high-quality, immersive metaverse
              experience for players.
            </p>

            <h4 className="text-2xl font-semibold text-yellow-400 mb-2">
              4. Roadmap
            </h4>
            <p className="text-lg mb-4">
              Our roadmap includes the phased release of features and updates to
              ensure steady growth and a vibrant community.
            </p>

            <h4 className="text-2xl font-semibold text-yellow-400 mb-2">
              5. Security & Transparency
            </h4>
            <p className="text-lg mb-4">
              We prioritize the security of our users’ assets and data. Smart
              contracts are audited, and our team is committed to transparency
              and community-driven governance.
            </p>

            <h4 className="text-2xl font-semibold text-yellow-400 mb-2">
              6. Conclusion
            </h4>
            <p className="text-lg mb-4">
              FlySky Network and Battle Legend together represent a new frontier
              in digital finance, gaming, and NFT economies. Join us to shape
              the future of entertainment and blockchain innovation.
            </p>
          </div>

          <p className="text-lg text-yellow-400 font-semibold mb-6">
            Be part of our growing ecosystem today.
          </p>
        </div>
      </section>
    </DashboardLayout>
  );
};

export default AboutUs;
