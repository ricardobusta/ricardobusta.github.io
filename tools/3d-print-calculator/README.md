# Simulador de custo de impressão 3D

Página estática para estimar o preço de uma impressão 3D em R$. O cálculo roda
inteiramente no navegador e não envia os dados para nenhum serviço externo.

## Como usar

1. Abra o `index.html` diretamente no navegador, pelo GitHub Pages ou por um servidor HTTP local.
2. Selecione a impressora e o filamento.
3. Informe o tempo total e o peso total mostrados pelo Bambu Studio.
4. Informe quantas peças foram produzidas no trabalho.
5. Use `Copiar info` para enviar a simulação.

Para conferir uma simulação recebida, cole a mensagem no painel inferior e use
`Conferir texto` ou `Colar e importar`.

## Executar localmente

Não é necessário servidor local: basta abrir o `index.html` por duplo clique.
Se preferir testar com um servidor HTTP, na pasta do projeto execute:

```bash
python3 -m http.server 8000
```

Depois abra <http://localhost:8000>.

## Publicar no GitHub Pages

O projeto não precisa de build ou dependências. Publique os arquivos pela opção
de GitHub Pages a partir da branch desejada. É possível publicar pela raiz do
repositório ou colocando o conjunto inteiro de arquivos dentro de `docs/`.

O projeto também funciona quando o repositório é publicado em uma subpasta.

## Editar parâmetros

Todos os valores ficam em `config.js`:

- `printers`: preço, consumo, vida útil e reserva de manutenção.
- `materials`: preço e peso dos rolos.
- `expenses`: energia, taxa de falhas, consumíveis e mão de obra opcional.
- `settings`: margem do serviço e valores iniciais do formulário.

Os arquivos são públicos quando o projeto está no GitHub Pages. Não coloque
informações pessoais neles.

## Modelo de cálculo

- Material = gramas / 1.000 × preço por kg.
- Reserva da impressora = horas × (preço + manutenção) / vida útil.
- Energia = horas × consumo médio × custo do kWh.
- Falhas = custo direto × taxa de falhas / (1 − taxa de falhas).
- Valor total = custo total / (1 − margem do serviço).

A margem inicial do serviço é 20% sobre o valor total.
