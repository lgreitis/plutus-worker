/* eslint-disable unicorn/filename-case */
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";

interface Properties {
  month: string;
  percentage: number;
  value: string;
  difference: string;
}

export const MonthlyMail = (properties: Properties) => {
  const { month, percentage, value, difference } = properties;

  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="bg-[#101214] border border-solid border-neutral-800 rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Container className="">
              <Img
                src={`https://plutus.lukasgreicius.com/plutus-white.png`}
                width="45"
                height="40"
                alt="Plutus"
                className="my-0 mx-auto text-white fill-white"
              />
              <Text className="text-white text-[24px] text-center font-semibold">
                Plutus
              </Text>
            </Container>
            <Heading className="text-white text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Your monthy inventory report for <strong>{month}</strong>
            </Heading>
            {percentage > 0 && (
              <Text className="text-white text-[18px] leading-[24px]">
                Your inventory increased in value by{" "}
                <strong className="text-green-400">
                  {percentage.toFixed(2)}%
                </strong>
                , which is equivalent to <strong>{difference}</strong>.
              </Text>
            )}
            {percentage < 0 && (
              <Text className="text-white text-[18px] leading-[24px]">
                Your inventory decreased in value by{" "}
                <strong className="text-red-400">
                  {Math.abs(percentage).toFixed(2)}%
                </strong>
                {", "}
                which is equivalent to <strong>{difference}</strong>.
              </Text>
            )}
            <Text className="text-white text-[18px] leading-[24px]">
              Your current inventory value is <strong>{value}</strong>
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                pX={20}
                pY={12}
                className="bg-white rounded text-black text-[16px] font-semibold no-underline text-center"
                href="https://plutus.lukasgreicius.com"
              >
                Go check out your inventory!
              </Button>
            </Section>
            <Text className="text-white text-[14px] leading-[24px]">
              These emails are opt-in. To stop receiving these messages, you can
              turn off emails in your account's settings.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default MonthlyMail;
