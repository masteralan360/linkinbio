import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Design() {
    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Design Appearance</h1>
                    <p className="text-muted-foreground">
                        Customize colors, fonts, and themes
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                    This page is under construction.
                </CardContent>
            </Card>
        </div>
    );
}
