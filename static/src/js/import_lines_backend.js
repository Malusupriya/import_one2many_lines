/**
 By Supriya: Importing selected lines for One2many field.
 Applicable only for O2M field.
 Need to add on O2M field in xml as
 "<field name='order_line' import_options={'model': 'product.product', 'title': 'Product', 'onchange_field': 'product_id',
  'domain': [('type', '=', 'consu'), ('company_id', '=', company_id)]}"
 where model: The popup of related model with records.
       title: Title of Pop-up.
       onchange_field: Field on that O2M record to add lines.
       domain: The domain for displaying records
 */

odoo.define('import_one2many_lines.import_lines_backend', function (require) {
    "use strict";


    const ListRenderer = require('web.ListRenderer');
    const dialogs = require('web.view_dialogs');
    const pyUtils = require('web.py_utils');
    const core = require('web.core');

    const _t = core._t;

    ListRenderer.include({
        events: _.extend({}, ListRenderer.prototype.events, {
            'click .o_import_lines': '_onClickImportLines',
        }),

        /**
         * @constructor
         */
        init: function (parent, state, params) {
            this._super.apply(this, arguments);
            this.parent = parent;
        },

        //--------------------------------------------------------------------------
        // Private
        //--------------------------------------------------------------------------

        /**
         * To add Import Lines button in O2M view
         * @returns {*}
         * @private
         */
        _renderRows: function () {
            var $rows = this._super();
            // Create a Import lines button
            var $a = $('<a href="#" role="button" class="ml16 o_import_lines">')
                        .text('Import Lines');
            if (this.addCreateLine) {
                // find last row from $rows
                var $last_row = $rows[$rows["length"]-1];
                if (this.handleField) {
                    // append your custom import lines button in 2nd <td>
                    $($last_row).find('td:last').append($a)
                } else {
                    // append your custom import lines button in 1st <td>
                    $($last_row).find('td:first').append($a)
                }
            }
            return $rows;
        },


        //--------------------------------------------------------------------------
        // Public
        //--------------------------------------------------------------------------

        /**
         * return form view controller.
         *
         * @public
         * @returns {object} custom controller.
         */
        getController: function (ev) {
            let controller;
            this.trigger_up('get_controller', {
                callback: (result) => {
                    controller = result;
                }
            });
            return controller;
        },


        //--------------------------------------------------------------------------
        // Handlers
        //--------------------------------------------------------------------------

        /**
         * To Import selected lines inside the O2M lines.
         *
         * @private
         */
        _onClickImportLines: function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            let dataList = [];
            let list = this.getParent().getParent().getParent().model.localData[this.parent.dataPointID];
            // for evaluating the domain
            let evalContext = list ? this.getParent().getParent().getParent().model._getEvalContext(list) : {};
            let import_data = pyUtils.py_eval(this.parent.attrs.import_options, evalContext);
            let onchange_field = import_data.onchange_field
            _.each(this.state.data, function(d) {
                if (d.data && d.data[onchange_field]){
                    dataList.push(d.data[onchange_field].res_id)
                }
            });
            // Open the popup
            new dialogs.SelectCreateDialog(this, {
                res_model: import_data.model,
                title: _t("Add: ") + import_data.title,
                domain: import_data.domain.concat(["!", ["id", "in", dataList]]),
                on_selected: function (records) {
                    let ResIds = _.pluck(records, 'id');
                    let newResIds = _.difference(ResIds, dataList);
                    if (newResIds.length) {
                        // Creating the context to create line with default value
                        let context = _.chain(ResIds).map((id) => {
                            let default_data = 'default_' + onchange_field
                            return {
                                [default_data]: id
                            }
                        }).value();
                        // Create line for selected records
                        this.getParent().getParent()._setValue({
                            operation: 'CREATE',
                            context: context,
                            position:'bottom'
                        });
                    }
                }
            }).open();
        },

        /**
         * This method is called when we click on the 'Import lines' button in a sub
         * list such as a one2many in a form view.
         *
         * @private
         * @param {MouseEvent} ev
         */
        _onAddRecord: function (ev) {
            let $target = $(ev.currentTarget);
            if ($target.hasClass('o_import_lines')) return;
            this._super.apply(this, arguments);
        },

    });

});