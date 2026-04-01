

'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, ShieldCheck, Bot } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "../components/header";
import { AppFooter } from "../components/app-footer";

export default function ContactPage() {
    return (
        <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12">
            <div className="w-full max-w-4xl mx-auto relative">
                <div className="absolute top-4 left-4 z-50">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to App
                        </Link>
                    </Button>
                </div>
                <Header />

                <div className="text-center mb-10 pt-16 sm:pt-0">
                    <div className="flex justify-center items-center gap-2.5 mb-6">
                        <Image src="/icons/logo-light.webp" alt="seQRets Logo" width={144} height={144} className="self-start -mt-2 dark:hidden" priority />
                        <Image src="/icons/logo-dark.webp" alt="seQRets Logo" width={144} height={144} className="self-start -mt-2 hidden dark:block" priority />
                        <div>
                            <h1 className="font-body text-5xl md:text-7xl font-black text-foreground tracking-tighter">
                                seQRets
                            </h1>
                            <p className="text-right text-base font-bold text-foreground tracking-wide">
                                Secure. Split. Share.
                            </p>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Contact Support</h2>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        Need help from a human? Reach out to the seQRets team directly via email.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Mail className="h-6 w-6 text-primary" />
                                <CardTitle>Send Email</CardTitle>
                            </div>
                            <CardDescription>General questions, feedback, and support</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <p>
                                For general inquiries, feature requests, or support questions, email us at:
                            </p>
                            <a
                                href="mailto:hello@seqrets.app?subject=seQRets Support Request"
                                className="inline-flex items-center gap-2 rounded-md border px-4 py-2 font-medium text-foreground transition-colors hover:bg-muted"
                            >
                                <Mail className="h-4 w-4" />
                                hello@seqrets.app
                            </a>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-6 w-6 text-primary" />
                                <CardTitle>Send Encrypted Email</CardTitle>
                            </div>
                            <CardDescription>PGP-encrypted via Proton Mail</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <p>
                                For sensitive inquiries, use our Proton Mail address. Emails between Proton Mail accounts are automatically PGP-encrypted.
                            </p>
                            <a
                                href="mailto:seqrets@proton.me?subject=seQRets Support Request (Encrypted)"
                                className="inline-flex items-center gap-2 rounded-md border px-4 py-2 font-medium text-foreground transition-colors hover:bg-muted"
                            >
                                <ShieldCheck className="h-4 w-4" />
                                seqrets@proton.me
                            </a>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Before You Email</CardTitle>
                        <CardDescription>You might find your answer faster with Bob AI</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <p>
                            Our AI assistant Bob is an expert on seQRets and can help with most questions about encryption, Qard management, inheritance planning, smart cards, and more.
                        </p>
                        <Button asChild variant="outline">
                            <Link href="/support">
                                <Bot className="mr-2 h-4 w-4" />
                                Ask Bob AI
                            </Link>
                        </Button>
                        <p className="pt-3 border-t text-xs">
                            For security vulnerabilities, please email <a href="mailto:security@seqrets.app" className="underline hover:text-foreground">security@seqrets.app</a> directly.
                        </p>
                    </CardContent>
                </Card>

                <AppFooter />
            </div>
        </main>
    );
}
