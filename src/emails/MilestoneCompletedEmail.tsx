import type React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";

type MilestoneCompletedEmailProps = { displayName: string; milestoneTitle: string; goalTitle: string; appUrl: string; goalId: string };

const MilestoneCompletedEmail: React.FC<MilestoneCompletedEmailProps> = ({ displayName, milestoneTitle, goalTitle, appUrl, goalId }) => (
  <Html><Head /><Preview>Milestone completed</Preview><Body style={{ backgroundColor: "#ffffff", color: "#171717", fontFamily: "Arial, sans-serif", padding: "32px 16px" }}><Container style={{ maxWidth: "560px", margin: "0 auto" }}><Text style={{ fontWeight: 700 }}>Northstar Loop</Text><Section style={{ border: "1px solid #e5e5e5", borderRadius: "12px", padding: "28px", marginTop: "24px" }}><Heading style={{ fontSize: "26px", margin: "0 0 12px" }}>Milestone complete.</Heading><Text style={{ color: "#525252", lineHeight: "24px" }}>Nice progress, {displayName}. You completed “{milestoneTitle}” for “{goalTitle}”. Review the goal to see what should receive attention next.</Text><Button href={`${appUrl}/goals/${goalId}`} style={{ backgroundColor: "#000000", color: "#ffffff", borderRadius: "8px", padding: "12px 18px", marginTop: "12px", textDecoration: "none" }}>Review goal</Button></Section></Container></Body></Html>
);

export default MilestoneCompletedEmail;
