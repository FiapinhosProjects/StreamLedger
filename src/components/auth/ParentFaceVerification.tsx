"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";

interface ParentFaceVerificationProps {
  onVerified: (result: FaceVerificationResult) => void;
  onCancel: () => void;
}

export interface FaceVerificationResult {
  verified: boolean;
  estimatedAge?: number;
  confidence?: number;
  sessionId?: string;
}

export default function ParentFaceVerification({ onVerified, onCancel }: ParentFaceVerificationProps) {
  const [step, setStep] = useState<"instructions" | "camera" | "processing" | "result">("instructions");
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<FaceVerificationResult | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Iniciar câmera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsVideoReady(false);
      setStep("camera");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
      setStep("instructions");
    }
  }, []);

  // Monitorar quando o vídeo está realmente pronto
  useEffect(() => {
    if (step !== "camera") return;

    const video = videoRef.current;
    if (!video) return;

    const checkReady = () => {
      if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        setIsVideoReady(true);
      } else {
        setTimeout(checkReady, 200);
      }
    };

    checkReady();
  }, [step]);

  // Parar câmera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoReady(false);
  }, []);

  // Capturar foto
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setCapturedImage(dataUrl);
    }
    stopCamera();
    setStep("processing");

    // Simular processamento Yoti
    setTimeout(() => {
      const margin = Math.floor(Math.random() * 10) - 5;
      const estimatedAge = 30 + margin;
      const confidence = 80 + Math.floor(Math.random() * 15);

      const isVerified = estimatedAge >= 18 && confidence >= 70;

      const faceResult: FaceVerificationResult = {
        verified: isVerified,
        estimatedAge: estimatedAge,
        confidence: confidence,
        sessionId: `face_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      setResult(faceResult);
      setStep("result");
    }, 2500);
  }, [stopCamera]);

  // Tentar novamente
  const retry = useCallback(() => {
    setCapturedImage(null);
    setResult(null);
    setError(null);
    setStep("instructions");
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="bg-card border border-neon/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-neon/5 border-b border-neon/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-neon">Verificação de Identidade</h2>
            <p className="text-muted text-sm">Reconhecimento facial obrigatório</p>
          </div>
          <button onClick={onCancel} className="text-white/60 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        {/* Instruções */}
        {step === "instructions" && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-neon/10 border border-neon/30 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-2">Verificação Facial</h3>
              <p className="text-muted text-sm">
                Para vincular um menor, você precisa confirmar sua identidade
                <br />
                com uma foto sua.
              </p>
            </div>

            <button
              onClick={startCamera}
              className="w-full py-3 rounded-xl bg-neon text-background font-semibold hover:opacity-90 transition-all"
            >
              Iniciar Verificação
            </button>

            {error && (
              <div className="bg-red/10 border border-red/30 rounded-lg p-3">
                <p className="text-red text-sm text-center">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Câmera ativa */}
        {step === "camera" && (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-64 border-2 border-neon/50 rounded-3xl" />
                </div>
              </div>

              <div className="absolute top-4 left-4 bg-red/80 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Ao vivo
              </div>

              {!isVideoReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-neon/30 border-t-neon rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-white text-xs">Carregando...</p>
                  </div>
                </div>
              )}
            </div>

            <p className="text-sm text-muted text-center">
              {isVideoReady
                ? "Posicione seu rosto dentro da moldura"
                : "Aguarde o vídeo carregar..."}
            </p>

            <button
              onClick={capturePhoto}
              disabled={!isVideoReady}
              className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                isVideoReady
                  ? "bg-neon text-background hover:opacity-90"
                  : "bg-neon/30 text-background/50 cursor-not-allowed"
              }`}
            >
              Capturar Foto
            </button>

            <button
              onClick={() => { stopCamera(); onCancel(); }}
              className="w-full py-2 text-muted hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Processando */}
        {step === "processing" && (
          <div className="text-center py-8 space-y-4">
            <div className="relative w-32 h-32 mx-auto">
              {capturedImage && (
                <Image
                  src={capturedImage}
                  alt="Foto capturada"
                  fill
                  className="object-cover rounded-lg"
                />
              )}
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-neon/30 border-t-neon rounded-full animate-spin" />
              </div>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">Verificando identidade...</p>
              <p className="text-sm text-muted">Analisando reconhecimento facial</p>
            </div>
          </div>
        )}

        {/* Resultado */}
        {step === "result" && result && (
          <div className="space-y-4">
            {capturedImage && (
              <div className="relative w-32 h-32 mx-auto">
                <Image
                  src={capturedImage}
                  alt="Foto capturada"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            )}

            {result.verified ? (
              <div className="bg-neon/10 border border-neon/30 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-neon/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-bold text-neon text-lg mb-1">Identidade Verificada</h3>
                <p className="text-sm text-muted">
                  Idade estimada: <span className="text-white font-semibold">{result.estimatedAge} anos</span>
                </p>
                <p className="text-xs text-muted/70 mt-1">
                  Confiança: {result.confidence}%
                </p>
              </div>
            ) : (
              <div className="bg-red/10 border border-red/30 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-red/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="font-bold text-red text-lg mb-1">Verificação Recusada</h3>
                <p className="text-sm text-muted">
                  Não foi possível verificar sua identidade.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {result.verified ? (
                <button
                  onClick={() => onVerified(result)}
                  className="flex-1 py-3 rounded-xl bg-neon text-background font-semibold hover:opacity-90 transition-all"
                >
                  Continuar
                </button>
              ) : (
                <>
                  <button
                    onClick={onCancel}
                    className="flex-1 py-3 rounded-xl border border-white/20 font-medium hover:bg-white/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={retry}
                    className="flex-1 py-3 rounded-xl bg-neon text-background font-semibold hover:opacity-90 transition-all"
                  >
                    Tentar Novamente
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
