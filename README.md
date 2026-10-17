# Presidente FC

Simulador mobile de presidência de futebol, com eleições, reputação, diretoria, treinador, elenco, transferências, finanças, notícias e temporadas simuladas.

## Gerar APK gratuitamente

O GitHub Actions compila o APK de debug quando houver push na branch `main` ou execução manual. Abra a aba **Actions**, selecione **Build Presidente FC APK** e baixe o artefato `presidente-fc-debug-apk` ao terminar.

## Projeto

- Aplicação web estática leve, adequada para WebView Android.
- Estado de carreira salvo no armazenamento local do dispositivo.
- Sem necessidade de serviços pagos, chaves de API ou créditos de IA.
- Clubes e atletas fictícios no protótipo, para evitar afirmar licenciamento de dados oficiais.

## Desenvolvimento

```bash
npm install
npm run build
npx cap add android
npx cap sync android
```

O APK debug é para teste. Antes de uma publicação na loja, é necessário preparar assinatura de release, política de privacidade e revisão dos recursos e licenças.
