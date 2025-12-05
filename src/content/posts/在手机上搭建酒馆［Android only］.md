---
title: 在手机上搭建酒馆［Android only］
pubDate: 2025-06-04
categories:
  - 折腾
description: ""
slug: build-a-sillytavern-on-phone
---
## 说一句
我自己不玩酒馆的，只是最近刷到很多帖子把这项目和Termux联系到了一起，其实是一种~~伪需求~~（过于麻烦了
## 准备
- 一部Android手机
- 科学上网环境
- Termux（在Google play或者F-Droid装一个）
## 流程
1. 先把梯子打开，不然下载的时候报错
2. 把Termux开开，你就得到了一个寄生在Android的Linux终端，先基本操作更新一下包管理器
```bash
pkg update && pkg upgrade
```
3. 再安一些基础包
```bash
pkg install git nodejs python build-essential
```
4. 安装SillyTavern
```bash
git clone https://github.com/SillyTavern/SillyTavern.git
```
	如果你的科学上网环境不稳定的话这一步必卡，可以去找一些GitHub加速站套用一下
5. 进入项目目录
```bash
cd SillyTavern
```
6. 给SillyTavern执行权限
```bash
chmod +x server.js
```
7. 安装依赖
```bash
npm install
```
	会有几个warn，不要管
8. 启动！
```bash
node server.js
```
9. 不出意外的话会有一长串输出到这一步就可以直接在本机浏览器访问了
`localhost:8000`
![[Screenshot_20250603-225352.png]]
	一般不会有端口冲突（应该吧
## 持续运行
如果你想要SillyTavern持续运行，可以给SillyTavern加一个服务脚本，如果你前面还在打印程序的输出，先记得啃臭+c把进程kill了
### 方案一（开机自启）
1. 先去安装一个Termux:boot（play版和其他版本互相不能混用），再在设置里给Termux和boot的电池白名单开开
2. 
```bash
# 安装termux-services
pkg install termux-services
# 重启termux服务
source $PREFIX/etc/profile.d/start-services.sh
```
3. 
```bash
# 创建服务目录
mkdir -p ~/.termux/boot
# 创建启动脚本
cat > ~/.termux/boot/sillytavern << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
cd ~/SillyTavern
node server.js --listen > ~/sillytavern.log 2>&1 &
EOF
# 依旧给权限
chmod +x ~/.termux/boot/sillytavern
```
### 方案二（开机不自启，但Termux划卡后持续运行）
直接复制粘贴
```bash
nohup node server.js --listen > sillytavern.log 2>&1 &
```
## 众乐乐
随时随地向朋友们分享自己的快乐
1. 开个热点或和客户端处于一个局域网内，看看自己的内网ip
```bash
ifconfig
```
	一般192.168开头的那个就是
2. 禁用白名单
```bash
nano config.yaml
# 打开后将相关选项改成如下配置
listen: true
whitelist: false
port: 8000
```
错误示范哈![[IMG_0244.jpeg]]
## 附言
最近有关因色情内容禁止酒馆的论调我想说的是：
	《网络空间独立宣言》发表已逾39年，然而公共网络遭受的行政审查却在不断强化，在这种情况下，酒馆作为网络私人空间居然也迎来了赛博长臂管辖，看来饭饱带来的不止是淫欲。
	当然那些滥用公益API的是另外一回事了
