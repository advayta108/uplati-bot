# 🔧 Решение проблем с деплоем

## Ошибка: Process completed with exit code 255

Эта ошибка обычно означает проблему с SSH соединением.

### Проверка 1: SSH ключ

1. **Проверьте формат ключа:**
   - Ключ должен начинаться с `-----BEGIN OPENSSH PRIVATE KEY-----` или `-----BEGIN RSA PRIVATE KEY-----`
   - Ключ должен заканчиваться на `-----END OPENSSH PRIVATE KEY-----` или `-----END RSA PRIVATE KEY-----`
   - Не должно быть лишних пробелов или символов

2. **Проверьте, что ключ добавлен в GitHub Secrets:**
   - Перейдите в Settings → Secrets and variables → Actions
   - Убедитесь, что `SSH_PRIVATE_KEY` существует
   - Проверьте, что ключ скопирован полностью (включая заголовки)

3. **Проверьте, что публичный ключ добавлен на сервер:**
   ```bash
   # На сервере проверьте файл authorized_keys
   cat ~/.ssh/authorized_keys
   
   # Или для root
   cat /root/.ssh/authorized_keys
   ```

### Проверка 2: IP адрес сервера

1. **Проверьте, что IP адрес правильный:**
   - В GitHub Secrets должно быть `SERVER_IP` с правильным IP адресом
   - IP должен быть доступен из сети, где работает GitHub Actions runner

2. **Проверьте доступность сервера:**
   ```bash
   # С GitHub Actions runner (если есть доступ)
   ping $SERVER_IP
   telnet $SERVER_IP 22
   ```

### Проверка 3: Права доступа на сервере

1. **Проверьте, что пользователь root может подключаться:**
   ```bash
   # На сервере
   sudo nano /etc/ssh/sshd_config
   # Убедитесь, что:
   # PermitRootLogin yes (или prohibit-password)
   # PasswordAuthentication no (для безопасности)
   ```

2. **Перезапустите SSH сервис:**
   ```bash
   sudo systemctl restart sshd
   ```

### Проверка 4: Файрвол

1. **Проверьте, что порт 22 открыт:**
   ```bash
   # На сервере
   sudo ufw status
   sudo iptables -L -n | grep 22
   ```

2. **Откройте порт, если нужно:**
   ```bash
   sudo ufw allow 22/tcp
   ```

### Проверка 5: GitHub Actions Runner

1. **Проверьте, что runner может подключаться к серверу:**
   - Если runner находится за NAT/firewall, может потребоваться настройка

2. **Проверьте логи runner:**
   - Посмотрите логи GitHub Actions для более детальной информации

## Ручная проверка SSH соединения

Выполните на локальной машине (или на GitHub Actions runner, если есть доступ):

```bash
# Тест подключения
ssh -v -o StrictHostKeyChecking=no -p 22 root@YOUR_SERVER_IP

# Если подключение успешно, проверьте команды
ssh root@YOUR_SERVER_IP 'echo "Connection OK" && hostname'
```

## Обновление Secrets в GitHub

1. Перейдите в репозиторий → Settings → Secrets and variables → Actions
2. Обновите или создайте:
   - `SERVER_IP` - IP адрес вашего сервера
   - `SSH_PRIVATE_KEY` - приватный SSH ключ
   - `TELEGRAM_BOT_TOKEN` - токен Telegram бота

## Альтернативный способ: Использование пароля (не рекомендуется)

Если SSH ключ не работает, можно временно использовать пароль:

```yaml
- name: Set up SSH with password
  run: |
    sshpass -p '${{ secrets.SSH_PASSWORD }}' ssh -o StrictHostKeyChecking=no root@$SERVER_IP 'echo "Connected"'
```

⚠️ **Внимание:** Использование паролей менее безопасно, чем SSH ключи!

## Проверка после исправления

После исправления проблем, workflow должен:
1. ✅ Успешно подключиться к серверу
2. ✅ Остановить старые контейнеры
3. ✅ Скопировать файлы
4. ✅ Запустить новые контейнеры

## Логи для отладки

Добавьте в workflow для отладки:

```yaml
- name: Debug SSH
  run: |
    echo "SERVER_IP: $SERVER_IP"
    ssh -v -o StrictHostKeyChecking=no root@$SERVER_IP 'echo "Test"'
```

