"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserInfo = exports.login = exports.loginValidation = exports.register = exports.registerValidation = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const prisma_1 = require("../models/prisma");
// 注册验证规则
exports.registerValidation = [
    (0, express_validator_1.body)('username')
        .isLength({ min: 2, max: 50 })
        .withMessage('用户名长度必须在2-50个字符之间')
        .matches(/^[a-zA-Z0-9_\-.]+$/)
        .withMessage('用户名只能包含字母、数字、下划线、点或中划线'),
    (0, express_validator_1.body)('phone')
        .isLength({ min: 6, max: 20 })
        .withMessage('手机号长度必须在6-20位之间')
        .matches(/^[0-9]+$/)
        .withMessage('手机号只能包含数字'),
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('请输入有效的邮箱地址')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6, max: 128 })
        .withMessage('密码长度必须在6-128个字符之间'),
    (0, express_validator_1.body)('realName')
        .isLength({ min: 2, max: 50 })
        .withMessage('真实姓名长度必须在2-50个字符之间')
        .matches(/^[\u4e00-\u9fa5a-zA-Z0-9\s]+$/)
        .withMessage('真实姓名只能包含中文、英文、数字和空格'),
    (0, express_validator_1.body)('idCard')
        .isLength({ min: 15, max: 18 })
        .withMessage('身份证号长度必须在15-18位之间')
        .matches(/^[0-9Xx]+$/)
        .withMessage('身份证号只能包含数字和X')
];
const register = async (req, res) => {
    try {
        // 验证输入
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: '输入验证失败',
                details: errors.array().map(err => err.msg)
            });
        }
        const { username, phone, email, password, realName, idCard } = req.body;
        // 检查用户名是否已存在
        const existingUser = await prisma_1.prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: '用户名已存在' });
        }
        // 检查手机号是否已存在
        const existingPhone = await prisma_1.prisma.user.findUnique({ where: { phone } });
        if (existingPhone) {
            return res.status(400).json({ error: '手机号已被注册' });
        }
        // 检查邮箱是否已存在
        const existingEmail = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({ error: '邮箱已被注册' });
        }
        // 检查姓名+身份证组合是否已存在（实名唯一）
        const existingRealId = await prisma_1.prisma.user.findFirst({ where: { realName, idCard } });
        if (existingRealId) {
            return res.status(400).json({ error: '该实名信息已注册' });
        }
        // 密码加密
        const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
        const hashedPassword = await bcrypt_1.default.hash(password, bcryptRounds);
        // 创建用户
        const user = await prisma_1.prisma.user.create({
            data: {
                username: username.trim(),
                phone: phone.trim(),
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                realName: realName.trim(),
                idCard: idCard.trim(),
                isVerified: false // 需要后台审批
            },
            select: {
                id: true,
                username: true,
                phone: true,
                email: true,
                realName: true,
                createdAt: true
            }
        });
        res.status(201).json({ message: '注册成功', user });
    }
    catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({ error: '注册失败，请稍后重试' });
    }
};
exports.register = register;
// 登录验证规则
exports.loginValidation = [
    (0, express_validator_1.body)('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('用户名长度必须在3-50个字符之间')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('用户名只能包含字母、数字和下划线'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6, max: 128 })
        .withMessage('密码长度必须在6-128个字符之间')
];
const login = async (req, res) => {
    try {
        // 验证输入
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: '输入验证失败',
                details: errors.array().map(err => err.msg)
            });
        }
        const { username, password } = req.body;
        // 支持用户名或邮箱登录
        let user = await prisma_1.prisma.user.findUnique({ where: { username } });
        if (!user && username && username.includes('@')) {
            user = await prisma_1.prisma.user.findUnique({ where: { email: username } });
        }
        if (!user) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }
        // 验证密码
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }
        // 生成JWT令牌
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ error: '服务未安全配置' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
        res.json({ message: '登录成功', token, user: {
                id: user.id,
                username: user.username,
                phone: user.phone,
                email: user.email,
                realName: user.realName
            } });
    }
    catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ error: '登录失败，请稍后重试' });
    }
};
exports.login = login;
const getUserInfo = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                phone: true,
                email: true,
                realName: true,
                createdAt: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('获取用户信息失败:', error);
        res.status(500).json({ error: '获取用户信息失败，请稍后重试' });
    }
};
exports.getUserInfo = getUserInfo;
