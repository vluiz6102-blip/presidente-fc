# Presidente FC

Simulador mobile de presidência e gestão de futebol, com interface responsiva para Android.

## O que já existe

- 27 clubes reais selecionáveis, do futebol brasileiro a gigantes europeus, com seus estádios e perfis de força/finanças inspirados no nível do clube.
- Eleição presidencial e ações de campanha; confiança de sócios, torcida, diretoria e reputação pública.
- Caixa, receitas e despesas diárias, patrocínios, folha salarial, investimentos em estádio, centro de treinamento e categorias de base.
- Treinador, elenco gerado para a carreira, contratação/venda de atletas, mercado e impacto de resultados na moral.
- Temporadas com sete rodadas, partidas simuladas, tabela que atualiza os demais jogos da rodada, manchetes, crises e salvamento local.
- Interface mobile em verde escuro, navegação por áreas e estilos/código do jogo separados para facilitar manutenção.

## Gerar APK grátis

O GitHub Actions compila um APK de debug a cada alteração na branch `main`. Acesse **Actions**, abra a execução mais recente concluída e baixe o artefato `presidente-fc-debug-apk`.

## Arquivos principais

- `www/index.html`: estrutura da interface.
- `www/styles.css`: tema e layout responsivo.
- `www/game.js`: dados e lógica da carreira.
- `capacitor.config.json`: identidade do app Android.
- `.github/workflows/build-apk.yml`: validação e compilação automática.

## Desenvolvimento

```bash
npm install
npm run build
npx cap add android
npx cap sync android
```

Os nomes de clubes são reais; jogadores do elenco e eventos são simulados, não um banco oficial licenciado. O APK de debug serve para teste. Publicação em loja exige assinatura de release, política de privacidade e revisão de licenças.
