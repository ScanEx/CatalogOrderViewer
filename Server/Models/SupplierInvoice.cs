using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    [Table("supplier_invoice", Schema="catalog")]
    public class SupplierInvoice
    {
        public SupplierInvoice () {}
        [Key, Column("supplier_invoice_id")]
        public int Id { get; set; }
        [Column("account")]
        public string Account { get; set; }
        [Column("code_shooting")]
        public string CodeShooting { get; set; }
        [Column("invoice_number")]
        public string InvoiceNumber { get; set; }
        [Column("source")]
        public string Source { get; set; }
        [Column("date_receipt")]
        public DateTime DateReceipt { get; set; }
        [Column("area")]
        public int Area { get; set; }
        [Column("cost")]
        public int Cost { get; set; }
        [Column("order_id")]
        public int OrderId { get; set; }
        [ForeignKey("OrderId")]
        public virtual Order Order { get; set; }
    }
}