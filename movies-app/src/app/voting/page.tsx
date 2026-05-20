import MovieVotingBoard from "@/components/MovieVotingBoard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Voting — Must See",
  description:
    "Community votes on Pete Chletsos's curated canon — captured by Snowflake Native App, aggregated by dbt, surfaced as a live leaderboard.",
};

export default function VotingPage() {
  return <MovieVotingBoard />;
}
