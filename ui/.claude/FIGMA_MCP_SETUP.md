# Figma MCP 配置

## 环境变量

在使用 Figma MCP 之前，需要设置以下环境变量：

```bash
FIGMA_ACCESS_TOKEN=your_figma_personal_access_token
```

## 获取 Figma Access Token

1. 登录 [Figma](https://www.figma.com/)
2. 点击右上角头像 → Settings
3. 在左侧菜单中找到 **Personal access tokens**
4. 点击 **Create new token**
5. 输入 token 名称（如 "Claude MCP"）
6. 复制生成的 token

## 使用方法

### 方式 1：设置环境变量

在启动 Claude 之前设置环境变量：

```bash
export FIGMA_ACCESS_TOKEN=your_token_here
# 然后启动 Claude
```

### 方式 2：使用 .env 文件

创建 `.env` 文件（不会提交到 Git）：

```bash
# 从模板复制
cp .env.example .env

# 编辑 .env 文件，填入你的 token
nano .env
```

### 方式 3：在 Claude 中设置

在 Claude 中直接询问：

```
请帮我获取 Figma 文件 xxx 的信息，使用 token: your_token_here
```

## 可用功能

配置完成后，你可以使用以下功能：

- 读取 Figma 文件内容
- 获取设计 Token（颜色、字体、间距等）
- 导出组件信息
- 获取图层详情

## 示例用法

```
@figma 读取文件 https://www.figma.com/file/xxxxx
@figma 获取设计 Token
@figma 导出组件列表
```
