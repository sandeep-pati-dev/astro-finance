import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Banknote,
  Building2,
  CreditCard,
  IndianRupee,
  Info,
  Pencil,
  PlusCircle,
  Smartphone,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { balanceApi, type WalletBalancePayload, type WalletBucket } from "@/lib/api";
import GlassCard from "@/components/GlassCard";

const BUCKETS: {
  key: WalletBucket;
  label: string;
  subtitle: string;
  icon: typeof Building2;
  gradient: string;
}[] = [
  {
    key: "bank",
    label: "Bank & UPI",
    subtitle: "UPI expenses deduct here",
    icon: Building2,
    gradient: "from-cyan-600 via-blue-600 to-indigo-600",
  },
  {
    key: "creditCard",
    label: "Credit card",
    subtitle: "Card expenses deduct here",
    icon: CreditCard,
    gradient: "from-violet-600 via-purple-600 to-fuchsia-600",
  },
  {
    key: "cash",
    label: "Cash",
    subtitle: "Cash expenses deduct here",
    icon: Banknote,
    gradient: "from-emerald-600 via-teal-600 to-cyan-600",
  },
];

const Balances = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<WalletBalancePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [activeBucket, setActiveBucket] = useState<WalletBucket | null>(null);
  const [formValue, setFormValue] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await balanceApi.get();
      if (res.data.success && res.data.data?.balance) {
        setBalance(res.data.data.balance);
      }
    } catch (e: any) {
      toast({
        title: "Could not load balances",
        description: e.userFriendlyMessage || e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  const parseInputAmount = (raw: string) => {
    const cleaned = raw.replace(/,/g, "").trim();
    if (cleaned === "" || cleaned === ".") return NaN;
    return parseFloat(cleaned);
  };

  const openEdit = (bucket: WalletBucket) => {
    if (!balance) return;
    setActiveBucket(bucket);
    const v =
      bucket === "bank"
        ? balance.bank
        : bucket === "creditCard"
          ? balance.creditCard
          : balance.cash;
    setFormValue(String(v));
    setEditOpen(true);
  };

  const openAdd = (bucket: WalletBucket) => {
    setActiveBucket(bucket);
    setFormValue("");
    setAddOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!activeBucket) return;
    const num = parseInputAmount(formValue);
    if (!Number.isFinite(num)) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const body =
        activeBucket === "bank"
          ? { bank: num }
          : activeBucket === "creditCard"
            ? { creditCard: num }
            : { cash: num };
      const res = await balanceApi.set(body);
      if (res.data.success && res.data.data?.balance) {
        setBalance(res.data.data.balance);
        toast({ title: "Balance updated" });
        setEditOpen(false);
      }
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e.userFriendlyMessage || e.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddMoney = async () => {
    if (!activeBucket) return;
    const num = parseInputAmount(formValue);
    if (!Number.isFinite(num) || num <= 0) {
      toast({
        title: "Enter a positive amount",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await balanceApi.add({ bucket: activeBucket, amount: num });
      if (res.data.success && res.data.data?.balance) {
        setBalance(res.data.data.balance);
        toast({ title: "Money added", description: formatCurrency(num) });
        setAddOpen(false);
      }
    } catch (e: any) {
      toast({
        title: "Could not add",
        description: e.userFriendlyMessage || e.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const valueFor = (key: WalletBucket) => {
    if (!balance) return 0;
    if (key === "bank") return balance.bank;
    if (key === "creditCard") return balance.creditCard;
    return balance.cash;
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 relative overflow-hidden">
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-300 hover:text-white hover:bg-white/10"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-2">
              <Wallet className="w-8 h-8 text-cyan-400" />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                My balances
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Set what you have; new expenses adjust the right bucket automatically. Expenses logged
              before this feature did not change these numbers—use Set balance once to match your real
              accounts.
            </p>
          </div>
        </div>

        <GlassCard className="border border-cyan-500/20 bg-slate-950/40" hover={false}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Info className="w-5 h-5 shrink-0" />
              </div>
              <div className="text-sm text-slate-300 space-y-1">
                <p className="font-medium text-white">How deductions work</p>
                <p className="flex items-center gap-2 text-slate-400">
                  <Banknote className="w-4 h-4" /> Cash expense → cash balance
                </p>
                <p className="flex items-center gap-2 text-slate-400">
                  <CreditCard className="w-4 h-4" /> Card expense → credit card balance
                </p>
                <p className="flex items-center gap-2 text-slate-400">
                  <Smartphone className="w-4 h-4" /> UPI expense → bank balance
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        {loading ? (
          <div className="text-center text-slate-500 py-24">Loading…</div>
        ) : balance ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6"
            >
              <p className="text-slate-400 text-sm uppercase tracking-widest mb-2">
                Total across accounts
              </p>
              <p className="text-4xl sm:text-5xl font-bold text-white flex items-center justify-center gap-2">
                <IndianRupee className="w-10 h-10 text-emerald-400" />
                <span>{formatCurrency(balance.total)}</span>
              </p>
              <p className="text-slate-500 text-xs mt-2">
                Last updated{" "}
                {new Date(balance.updatedAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-3">
              {BUCKETS.map((b, i) => {
                const Icon = b.icon;
                const val = valueFor(b.key);
                const low = val < 0;
                return (
                  <GlassCard
                    key={b.key}
                    delay={i * 0.08}
                    className={`border border-white/10 bg-slate-950/50 ${low ? "ring-1 ring-amber-500/40" : ""}`}
                    hover={false}
                  >
                    <div
                      className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${b.gradient} mb-4 shadow-lg`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{b.label}</h3>
                    <p className="text-xs text-slate-500 mb-3">{b.subtitle}</p>
                    <p
                      className={`text-2xl font-bold mb-4 ${low ? "text-amber-400" : "text-white"}`}
                    >
                      {formatCurrency(val)}
                    </p>
                    {low && (
                      <p className="text-xs text-amber-400/90 mb-3">
                        Negative balance — you may be over budget on this bucket.
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/10 text-white hover:bg-white/20 border-0"
                        onClick={() => openEdit(b.key)}
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Set balance
                      </Button>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-0"
                        onClick={() => openAdd(b.key)}
                      >
                        <PlusCircle className="w-4 h-4 mr-1" />
                        Add money
                      </Button>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </>
        ) : null}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-slate-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Set balance</DialogTitle>
            <DialogDescription className="text-slate-400">
              Replace the stored amount for this bucket (does not undo past expenses).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="edit-amt">Amount (INR)</Label>
            <Input
              id="edit-amt"
              type="number"
              step="0.01"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              className="bg-black/40 border-white/20 text-white"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-slate-950 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Add money</DialogTitle>
            <DialogDescription className="text-slate-400">
              Increases this bucket (salary, transfer, ATM withdrawal, etc.).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="add-amt">Amount (INR)</Label>
            <Input
              id="add-amt"
              type="number"
              step="0.01"
              min="0"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              className="bg-black/40 border-white/20 text-white"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMoney} disabled={saving}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Balances;
