import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { KeyRound, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const PIN_KEY = "acpbm_pin";

export function SettingsPage() {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit() {
    setError("");
    const stored = localStorage.getItem(PIN_KEY) || "";
    if (currentPin !== stored) {
      setError("Current PIN is incorrect.");
      setCurrentPin("");
      return;
    }
    if (newPin.length !== 4) {
      setError("New PIN must be 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setError("New PINs do not match.");
      setConfirmPin("");
      return;
    }
    localStorage.setItem(PIN_KEY, newPin);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setSuccess(true);
    toast.success("PIN changed successfully!");
    setTimeout(() => setSuccess(false), 4000);
  }

  const canSubmit =
    currentPin.length === 4 && newPin.length === 4 && confirmPin.length === 4;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your app preferences and security.
        </p>
      </div>

      <div className="max-w-lg">
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Change PIN
                </CardTitle>
                <CardDescription className="text-xs">
                  Update your 4-digit access PIN
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Current PIN */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Current PIN</p>
              <InputOTP
                maxLength={4}
                value={currentPin}
                onChange={(v) => {
                  setCurrentPin(v);
                  setError("");
                }}
                data-ocid="settings.current_pin.input"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* New PIN */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">New PIN</p>
              <InputOTP
                maxLength={4}
                value={newPin}
                onChange={(v) => {
                  setNewPin(v);
                  setError("");
                }}
                data-ocid="settings.new_pin.input"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Confirm New PIN */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Confirm New PIN
              </p>
              <InputOTP
                maxLength={4}
                value={confirmPin}
                onChange={(v) => {
                  setConfirmPin(v);
                  setError("");
                }}
                data-ocid="settings.confirm_pin.input"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Error */}
            {error && (
              <p
                className="text-sm text-destructive flex items-center gap-1.5"
                data-ocid="settings.change_pin.error_state"
              >
                {error}
              </p>
            )}

            {/* Success */}
            {success && (
              <div
                className="flex items-center gap-2 text-sm text-emerald-500"
                data-ocid="settings.change_pin.success_state"
              >
                <ShieldCheck className="w-4 h-4" />
                PIN updated successfully!
              </div>
            )}

            <Button
              className="w-full"
              disabled={!canSubmit}
              onClick={handleSubmit}
              data-ocid="settings.change_pin.submit_button"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              Change PIN
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
