const Workflow = require('../models/Workflow');

exports.list = async (req, res, next) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit) || 20, 1);
        const sortBy = req.query.sortBy || 'updatedAt';
        const order = req.query.order === 'asc' ? 1 : -1;

        const query = { userId: req.user._id };
        const total = await Workflow.countDocuments(query);
        const pages = Math.ceil(total / limit) || 1;
        const workflows = await Workflow.find(query)
            .sort({ [sortBy]: order })
            .skip((page - 1) * limit)
            .limit(limit)
            .select('name description isActive isDraft createdAt updatedAt nodes edges')
            .lean();

        const mapped = workflows.map(w => ({
            id: w._id,
            name: w.name,
            description: w.description,
            isActive: w.isActive,
            isDraft: w.isDraft,
            createdAt: w.createdAt,
            updatedAt: w.updatedAt,
            nodeCount: (w.nodes || []).length,
            edgeCount: (w.edges || []).length
        }));

        res.json({ success: true, workflows: mapped, total, page, pages });
    } catch (err) {
        next(err);
    }
};

exports.get = async (req, res, next) => {
    try {
        const id = req.params.id;
        const workflow = await Workflow.findById(id).lean();
        if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });
        if (String(workflow.userId) !== String(req.user._id)) return res.status(403).json({ success: false, error: 'Access denied' });
        res.json({ success: true, workflow });
    } catch (err) {
        next(err);
    }
};

exports.create = async (req, res, next) => {
    try {
        const { name, description, nodes, edges } = req.body;
        if (!name) return res.status(400).json({ success: false, error: 'Name is required' });
        if (name.length > 200) return res.status(400).json({ success: false, error: 'Name too long' });
        if (nodes && !Array.isArray(nodes)) return res.status(400).json({ success: false, error: 'nodes must be an array' });
        if (edges && !Array.isArray(edges)) return res.status(400).json({ success: false, error: 'edges must be an array' });

        const workflow = new Workflow({
            userId: req.user._id,
            name,
            description,
            nodes: nodes || [],
            edges: edges || [],
            isDraft: true
        });
        await workflow.save();
        res.status(201).json({
            success: true,
            data: workflow,
            message: 'Workflow created successfully'
        });

    } catch (err) {
        next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const workflow = await Workflow.findById(id);
        if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });
        if (String(workflow.userId) !== String(req.user._id)) return res.status(403).json({ success: false, error: 'Access denied' });

        const { name, description, nodes, edges, isActive, isDraft } = req.body;
        if (name) {
            if (name.length > 200) return res.status(400).json({ success: false, error: 'Name too long' });
            workflow.name = name;
        }
        if (description !== undefined) workflow.description = description;
        if (nodes !== undefined) {
            if (!Array.isArray(nodes)) return res.status(400).json({ success: false, error: 'nodes must be an array' });
            workflow.nodes = nodes;
        }
        if (edges !== undefined) {
            if (!Array.isArray(edges)) return res.status(400).json({ success: false, error: 'edges must be an array' });
            workflow.edges = edges;
        }
        if (typeof isActive === 'boolean') workflow.isActive = isActive;
        if (typeof isDraft === 'boolean') workflow.isDraft = isDraft;

        await workflow.save();
        res.json({ success: true, workflow, message: 'Workflow updated successfully' });
    } catch (err) {
        next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const id = req.params.id;
        const workflow = await Workflow.findById(id);
        if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });
        if (String(workflow.userId) !== String(req.user._id)) return res.status(403).json({ success: false, error: 'Access denied' });
        await workflow.deleteOne();
        res.json({ success: true, message: 'Workflow deleted successfully' });
    } catch (err) {
        next(err);
    }
};

exports.activate = async (req, res, next) => {
    try {
        const id = req.params.id;
        const workflow = await Workflow.findById(id);
        if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });
        if (String(workflow.userId) !== String(req.user._id)) return res.status(403).json({ success: false, error: 'Access denied' });
        workflow.isActive = true;
        workflow.isDraft = false;
        await workflow.save();
        res.json({ success: true, message: 'Workflow activated' });
    } catch (err) {
        next(err);
    }
};

exports.deactivate = async (req, res, next) => {
    try {
        const id = req.params.id;
        const workflow = await Workflow.findById(id);
        if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });
        if (String(workflow.userId) !== String(req.user._id)) return res.status(403).json({ success: false, error: 'Access denied' });
        workflow.isActive = false;
        await workflow.save();
        res.json({ success: true, message: 'Workflow deactivated' });
    } catch (err) {
        next(err);
    }
};

exports.duplicate = async (req, res, next) => {
    try {
        const id = req.params.id;
        const orig = await Workflow.findById(id).lean();
        if (!orig) return res.status(404).json({ success: false, error: 'Workflow not found' });
        if (String(orig.userId) !== String(req.user._id)) return res.status(403).json({ success: false, error: 'Access denied' });

        const copy = new Workflow({
            userId: req.user._id,
            name: `Copy of ${orig.name}`,
            description: orig.description,
            nodes: orig.nodes || [],
            edges: orig.edges || [],
            isActive: false,
            isDraft: true
        });
        await copy.save();
        res.status(201).json({ success: true, workflow: copy, message: 'Workflow duplicated' });
    } catch (err) {
        next(err);
    }
};
