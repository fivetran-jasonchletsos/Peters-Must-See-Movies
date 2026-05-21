import MovieVotingBoard from "@/components/MovieVotingBoard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Voting — Peter's Movies",
  description:
    "Community votes on Peter Chletsos's curated canon — captured by Snowflake Native App, aggregated by dbt, surfaced as a live leaderboard.",
};

export default function VotingPage() {
  return <MovieVotingBoard />;
}
