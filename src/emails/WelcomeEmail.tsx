import type React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";

type WelcomeEmailProps = { displayName: string; appUrl: string };

const WelcomeEmail: React.FC<WelcomeEmailProps> = ({ displayName, appUrl }) => (
  <Html>
    <Head />
    <Preview>Welcome to Northstar Loop</Preview>
    <Body style={{ backgroundColor: "#ffffff", color: "#171717", fontFamily: "Arial, sans-serif", margin: 0, padding: "32px 16px" }}>
      <Container style={{ maxWidth: "560px", margin: "0 auto" }}>
        <Text style={{ fontSize: "14px", fontWeight: 700 }}>Northstar Loop</Text>
        <Section style={{ border: "1px solid #e5e5e5", borderRadius: "12px", padding: "28px", marginTop: "24px" }}>
          <Heading style={{ fontSize: "28px", lineHeight: "34px", margin: "0 0 12px" }}>Know what matters next.</Heading>
          <Text style={{ color: "#525252", fontSize: "15px", lineHeight: "24px" }}>Hi {displayName}, your workspace is ready. Define one meaningful goal and turn it into milestones, tasks, and a clear next focus.</Text>
          <Button href={`${appUrl}/onboarding`} style={{ backgroundColor: "#000000", color: "#ffffff", borderRadius: "8px", padding: "12px 18px", marginTop: "12px", textDecoration: "none" }}>Create your first plan</Button>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;
