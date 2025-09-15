# WebApi C# de Exemplo

Esta aplicação é uma API em C# usada como exemplo para demonstrar **como fazer o deploy em um ambiente Kubernetes**.

## Executar localmente

Para rodar a aplicação em seu ambiente de desenvolvimento:

```bash
cd src
cat >> appsettings.Development.json << EOL
{
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    }
  },
  "DatabaseUrl": "postgres://user:password@host/dbname",
  "JwtKey": "MY_JWT_KEY_SAMPLE",
  "PublicUrl": "https://myapi.com.br",
  "Enabled": true
}
EOL

dotnet run
```

> ⚠️ Substitua os valores de configuração (DatabaseUrl, JwtKey, PublicUrl) pelos corretos para seu ambiente.

## Gerar imagem Docker

Para criar a imagem Docker localmente:

```bash
docker build -t wprmdev/dotnet-sample:v1.0.0 .
```

* A tag `v1.0.0` deve corresponder à versão da release.

## Executar local com Docker Compose

Para executar a aplicação junto com outros serviços dependentes (como banco de dados) usando Docker Compose:

```bash
docker-compose up
```

## Publicar imagem Docker

Para enviar a imagem para o registro (DockerHub ou privado):

```bash
docker login
docker push wprmdev/dotnet-sample:v1.0.0
```

## Deploy no cluster Kubernetes

Para aplicar os manifests no cluster:

> 📌 O arquivo `docker-registry.yaml` deve ser editado com as credenciais do seu registro de imagens antes da aplicação.

```bash
# Seleciona o contexto do cluster
kubectl config use-context YOUR-CONTEXT

# Aplica os manifestos base (Apenas uma vez)
kubectl apply -f k8s/base/namespace.yaml
kubectl apply -f k8s/base/docker-registry.yaml

# Aplica os manifestos da aplicação
kubectl apply -f k8s/app

# Verifica o status dos pods
kubectl get pods -n k8ssample
```