"use client";
import { useRouter } from "next/navigation";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Camera, HandMetal, Video, FileText } from "lucide-react";

const DeafPage = () => {
    const router = useRouter();

    const features = [
        {
            title: "Sign Detection",
            description:
                "Real-time sign language detection and interpretation using your camera",
            icon: <Camera className="w-24 h-24 text-white" />,
            path: "/deaf/sign-detect",
            gradient: "from-[#FF416C] to-[#FF4B2B]",
        },
        {
            title: "Hand Sign Translate",
            description:
                "Real-time hand sign detection and translation using your camera",
            icon: <HandMetal className="w-24 h-24 text-white" />,
            path: "/deaf/hand-translate",
            gradient: "from-[#4776E6] to-[#8E54E9]",
        },
        {
            title: "Sign Video Tutorial",
            description:
                "Watch and learn from detailed sign language video tutorials",
            icon: <Video className="w-24 h-24 text-white" />,
            path: "/deaf/sign-video",
            gradient: "from-[#11998e] to-[#38ef7d]",
        },
        {
            title: "PPT to Video",
            description:
                "Convert PowerPoint presentations to explanatory videos with text.",
            icon: <FileText className="w-24 h-24 text-white" />,
            path: "/deaf/ppt-to-video",
            gradient: "from-[#c44601] to-[#c44601]",
        },
    ];

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 px-12">
            <div className="container mx-auto py-12">
                <h1 className="text-4xl font-bold text-center mb-12 text-gray-800">
                    Accessibility Tools for Deaf Users
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {features.map((feature, index) => (
                        <Card
                            key={index}
                            className={`relative overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 border-0 shadow-xl`}
                            onClick={() => router.push(feature.path)}
                        >
                            <div
                                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-90`}
                            />
                            <CardHeader className="relative h-[400px] flex flex-col items-center justify-center text-center space-y-8 p-8">
                                {feature.icon}
                                <CardTitle className="text-3xl font-bold text-white">
                                    {feature.title}
                                </CardTitle>
                                <CardDescription className="text-xl font-medium text-white/90">
                                    {feature.description}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DeafPage;
