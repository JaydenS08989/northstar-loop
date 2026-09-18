import type React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";

type GoalCompletedEmailProps = { displayName: string; goalTitle: string; appUrl: string };

const GoalCompletedEmail: React.FC<GoalCompletedEmailProps> = ({ displayName, goalTitle, appUrl }) => (
  <Html><Head /><Preview>Goal completed</Preview><Body style={{ backgroundColor: "#ffffff", color: "#171717", fontFamily: "Arial, sans-serif", padding: "32px 16px" }}><Container style={{ maxWidth: "560px", margin: "0 auto" }}><Text style={{ fontWeight: 700 }}>Northstar Loop</Text><Section style={{ border: "1px solid #e5e5e5", borderRadius: "12px", padding: "28px", marginTop: "24px" }}><Heading style={{ fontSize: "26px", margin: "0 0 12px" }}>Goal complete.</Heading><Text style={{ color: "#525252", lineHeight: "24px" }}>{displayName}, you completed “{goalTitle}”. Northstar Loop has recorded the progress so you can decide what deserves focus next.</Text><Button href={`${appUrl}/dashboard`} style={{ backgroundColor: "#000000", color: "#ffffff", borderRadius: "8px", padding: "12px 18px", marginTop: "12px", textDecoration: "none" }}>Open dashboard</Button></Section></Container></Body></Html>
);

export default GoalCompletedEmail;
