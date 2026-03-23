import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import FindMyPhotosClient from "./FindMyPhotosClient";

export const metadata: Metadata = {
  title: "Find My Photos — Priti & Rupesh Wedding Gallery",
  description:
    "Take a selfie or upload your photo to find all pictures of you from the wedding celebration.",
};

export default function FindMyPhotosPage() {
  return (
    <>
      <Navbar />
      <FindMyPhotosClient />
    </>
  );
}
