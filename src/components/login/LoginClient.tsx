"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Label,
  ListBox,
  Select,
  type Key,
} from "@heroui/react";
import { Icon } from "@/components/icons";
import {
  fetchEstacoes,
  fetchUsuarios,
  ocuparEstacao,
  saveSession,
  type ApiEstacao,
  type ApiUser,
} from "@/lib/api";
import { StationPicker } from "./StationPicker";

export function LoginClient() {
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<ApiUser[]>([]);
  const [estacoes, setEstacoes] = useState<ApiEstacao[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [user, setUser] = useState("");
  const [dob, setDob] = useState("");
  const [station, setStation] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([fetchUsuarios(), fetchEstacoes()])
      .then(([users, estacoesData]) => {
        if (!active) return;
        setUsuarios(users);
        setEstacoes(estacoesData.estacoes);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os dados."
        );
      })
      .finally(() => {
        if (active) setLoadingData(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // O app legado Embalei gravou a data de nascimento como DD/MM/YY (ano com
  // 2 dígitos). O operador digita diretamente nesse formato, então aplicamos
  // uma máscara enquanto ele digita e enviamos o valor sem conversão.
  const formatBirthDate = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    const segments: string[] = [];
    if (digits.length > 0) segments.push(digits.slice(0, 2));
    if (digits.length > 2) segments.push(digits.slice(2, 4));
    if (digits.length > 4) segments.push(digits.slice(4, 6));
    return segments.join("/");
  };

  const isBirthDateComplete = /^\d{2}\/\d{2}\/\d{2}$/.test(dob);

  const errors = useMemo(
    () => ({
      user: !user,
      dob: !isBirthDateComplete,
      station: station == null,
    }),
    [user, isBirthDateComplete, station]
  );

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    setSubmitError(null);
    if (errors.user || errors.dob || errors.station || station == null) return;
    setLoading(true);
    try {
      const session = await ocuparEstacao({
        workstationId: station,
        username: user,
        birthDate: dob,
      });
      saveSession(session);
      router.push("/embalagem");
    } catch (error: unknown) {
      setSubmitError(
        error instanceof Error ? error.message : "Não foi possível entrar."
      );
      setLoading(false);
    }
  };

  const showErr = (k: keyof typeof errors) => submitted && errors[k];

  return (
    <div className="login-root">
      <aside className="visual">
        <div className="visual-grid" />
        <div className="brand">
          <div className="brand-mark">E</div>
          <span>Embalei</span>
        </div>
        <div className="visual-body">
          <span className="eyebrow">Estação de embalagem</span>
          <h1>
            Bipa, embala
            <br />e <span className="accent">manda ver.</span>
          </h1>
          <p className="lede">
            Identifique-se para abrir uma estação. Cada pedido bipado puxa itens,
            caixa recomendada, transportadora e temperatura no destino.
          </p>
          <div className="mini-scanner">
            <span className="label">SYM · LS2208</span>
            <span className="led">ONLINE</span>
            <div className="window" />
          </div>
        </div>
      </aside>

      <main className="form-side">
        <form className="form-card" onSubmit={onSubmit} noValidate>
          <h2 className="form-title">Entrar na estação</h2>
          <p className="form-sub">
            Selecione seu usuário, confirme sua data de nascimento e escolha em
            qual estação você vai embalar hoje.
          </p>

          {loadError && (
            <div className="field invalid">
              <div className="error" style={{ display: "block" }}>
                {loadError}
              </div>
            </div>
          )}

          <div className={"field" + (showErr("user") ? " invalid" : "")}>
            <Select
              aria-label="Usuário"
              placeholder={
                loadingData ? "Carregando usuários…" : "Selecione seu nome"
              }
              value={user || null}
              isInvalid={showErr("user")}
              isDisabled={loadingData || !!loadError}
              onChange={(v: Key | Key[] | null) =>
                setUser(v == null ? "" : String(v))
              }
            >
              <Label>Usuário</Label>
              <Select.Trigger className="hero-select-trigger">
                <span className="ic-left">
                  <Icon.user width={16} height={16} />
                </span>
                <Select.Value />
                <Select.Indicator className="hero-select-chev">
                  <Icon.chev width={16} height={16} />
                </Select.Indicator>
              </Select.Trigger>
              <Select.Popover className="hero-select-pop">
                <ListBox>
                  {usuarios.map((u) => (
                    <ListBox.Item
                      key={u.id}
                      id={u.username}
                      textValue={u.username}
                    >
                      {u.username}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
            <div className="error">Selecione um usuário.</div>
          </div>

          <div className={"field" + (showErr("dob") ? " invalid" : "")}>
            <label htmlFor="dob">Data de nascimento</label>
            <div className="ctrl">
              <span className="ic-left">
                <Icon.cake width={16} height={16} />
              </span>
              <Input
                id="dob"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                aria-label="Data de nascimento (dd/mm/aa)"
                placeholder="dd/mm/aa"
                value={dob}
                onChange={(e) => setDob(formatBirthDate(e.target.value))}
                maxLength={8}
                required
              />
            </div>
            <div className="help">Confirmação de identidade. Formato: dd/mm/aa.</div>
            <div className="error">Informe sua data de nascimento (dd/mm/aa).</div>
          </div>

          <div className={"field" + (showErr("station") ? " invalid" : "")}>
            <StationPicker
              stations={estacoes}
              selectedId={station}
              loading={loadingData}
              onSelect={setStation}
            />
            <div className="error">Escolha uma estação disponível.</div>
          </div>

          {submitError && (
            <div className="field invalid">
              <div className="error" style={{ display: "block" }}>
                {submitError}
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="submit"
            isDisabled={loading || loadingData || !!loadError}
            isPending={loading}
          >
            {({ isPending }) =>
              isPending ? (
                <>
                  <span className="spin" />
                  Abrindo estação…
                </>
              ) : (
                <>
                  Entrar
                  <Icon.arrow width={16} height={16} />
                </>
              )
            }
          </Button>

          <div className="small">
            <span>Não consegue entrar? Fale com o supervisor.</span>
          </div>
        </form>
        <div className="build">
          <span>EMBALEI · STATION OS</span>
          <span>v3.4.1 · 2026</span>
        </div>
      </main>
    </div>
  );
}
