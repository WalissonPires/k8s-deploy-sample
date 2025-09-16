# 🚀 Kubernetes Deploy com GitOps e CI/CD

Este repositório demonstra uma abordagem de **deploy automatizado em Kubernetes** utilizando **GitHub Actions** e o conceito de **GitOps**.

A ideia central é oferecer uma **Developer Experience (DX) simplificada**, onde o time de desenvolvimento foca apenas em evoluir a aplicação, enquanto o processo de build, geração de imagens Docker e publicação no cluster Kubernetes acontece de forma automática e controlada.

## ⚙️ Configuração inicial do cluster Kubernetes

Antes de publicar a aplicação, é necessário configurar o cluster aplicando o manifesto iniciais. Esses arquivos estão na pasta `k8s/base` e devem ser aplicados **apenas uma vez**.

> 📌 O arquivo `docker-registry.yaml` deve ser editado com as credenciais do seu registro de imagens antes da aplicação.

```sh
kubectl config use-context YOUR-CONTEXT
kubectl apply -f k8s/base/namespace.yaml
kubectl apply -f k8s/base/docker-registry.yaml
```

## 🛠️ Deploy manual (opcional)

Caso queira publicar a aplicação **manualmente** no cluster sem usar o pipeline veja o arquivo [project.md](project.md).

## 🔑 Configurações do GitHub Actions

Para que os pipelines funcionem corretamente, adicione os seguintes **Secrets** no GitHub Actions do repositório:

| Nome do Secret      | Descrição                                                                                                                                |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `KUBECONFIG_DATA`   | Arquivo de configuração do `kubectl` em base64, para acessar o cluster. <br>Gerar base64: `cat $HOME/.kube/config | base64 -w 0`        |
| `REGISTRY_URL`      | URL do registro de imagens Docker. <br>Deixe vazio para DockerHub. Para registro privado, informe o domínio (ex.: `my-registry.com.br`). |
| `REGISTRY_USER`     | Nome de usuário do registro de imagens (DockerHub ou privado).                                                                           |
| `REGISTRY_PASSWORD` | Senha ou token de autenticação do registro de imagens.                                                                                   |


## 🚦 Fluxo de trabalho recomendado

O fluxo de desenvolvimento e deploy segue as etapas abaixo:

### 1. Desenvolvimento

Durante a sprint, faça commits normalmente para cada tarefa concluída:

```bash
# Tarefa 1
git add .
git commit -m "feat: tarefa1 concluída"
git push

# Tarefa 2
git add .
git commit -m "feat: tarefa2 concluída"
git push
```

### 2. Publicando uma release

Quando todas as tarefas estiverem concluídas e for hora de liberar uma nova versão:

```bash
# Cria uma tag semver (ex.: v1.0.0)
git tag v1.0.0

# Envia a tag para o GitHub
git push origin v1.0.0
```

O push da tag dispara o **workflow de Build**, que:
1. Builda e publica a imagem Docker com a versão da tag.
2. Atualiza o `deployment.yaml` com a nova tag.
3. Commita o manifesto atualizado no repositório.

### 3. Deploy automático no cluster

Um segundo workflow, **Apply K8s Manifests**, monitora alterações na pasta `k8s`.
Sempre que o `deployment.yaml` ou outros manifestos forem atualizados, o workflow aplica essas mudanças no cluster automaticamente.

✅ Isso garante **segurança e rastreabilidade**: só há deploy quando existe uma release ou mudanças explícitas nos manifestos.

## 🔐 Trabalhando com SealedSecrets

Por segurança, **nunca devemos commitar chaves, senhas ou qualquer dado sensível**.
Este repositório utiliza o `SealedSecrets` da Bitnami para criptografar esses dados sensíveis e usar como secrets do Kubernetes, permitindo que sejam versionados com segurança no Git.

### 📌 Fluxo para gerar um SealedSecret

```sh
cd k8s/app

# Criar um arquivo .env temporário com os segredos
cat >> .env.production << EOL
#name: dotnetapi-secrets
#namespace: k8ssample
DatabaseUrl=postgres://user:password@host/dbname
PublicUrl=https://k8s-dotnetapi.wprm.com.br
JwtKey=MY_PWT_KEY
Enabled=true
File=base64:aGVsbG8K
EOL

# Gerar o SealedSecret a partir do .env
node ../generate-sealed-secrets.js ./.env.production ./sealedsecrets.yaml

# Remover o arquivo .env para não deixar secrets em texto plano
rm .env.production
```

### 📖 Regras do `.env`

- Segredos em texto plano são automaticamente convertidos em **base64**.
- Valores já em base64 devem ter o prefixo `base64:`:
  ```ini
  CERT=base64:MIIC8DCCAdigAwIBAgI...
  ```
- O cabeçalho deve definir o nome e namespace do Secret:
  ```ini
  #name: dotnetapi-secrets
  #namespace: k8ssample
  ```

### ✅ Resultado esperado

O script gera um arquivo `sealedsecrets.yaml` no formato:

```yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: dotnetapi-secrets
  namespace: k8ssample
spec:
  encryptedData:
    DatabaseUrl: AgBp0G…
    JwtKey: AgBp05…
    HELLO: AgBp0A…
```

Esse arquivo pode ser commitado em segurança no repositório.
No cluster, o controlador do SealedSecrets descriptografa e recria automaticamente o Secret original.

## Recursos instalados no cluster Kubernetes

No cluster kubernentes utilizado nesse exemplo existem os seguintes recursos configurados:

- **ingress-nginx:** Nginx ingress usado como proxy para expor as aplicações na web.
- **sealed-secrets (Bitnami):** Ferramenta para encriptar/decriptar secrets.
- **cert-manager:** Ferramenta para gerar certificados para proteger as aplicações web sobre HTTPS.