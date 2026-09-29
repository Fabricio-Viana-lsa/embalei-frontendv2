import { Icon } from "@/components/icons";

export function EmptyState() {
  return (
    <div className="empty">
      <div className="empty-illus">
        <Icon.pkg width={28} height={28} />
      </div>
      <h3>Aguardando bipagem do pedido</h3>
      <div>
        Escaneie a chave de acesso da NF-e ou o número do pedido no leitor para carregar o pedido.
      </div>
    </div>
  );
}
