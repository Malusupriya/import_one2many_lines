from odoo import api, fields, models, SUPERUSER_ID, _


class SaleOrderLine(models.Model):
    _inherit = "sale.order.line"

    display_type = fields.Selection(selection_add=[('line_import', 'Import lines')])


class ProductProduct(models.Model):
    _inherit = "product.product"

    sale_id = fields.Many2one('sale.order', string='Order Reference')
    company_id = fields.Many2one('res.company', 'Company', required=True, index=True,
                                 default=lambda self: self.env.company)