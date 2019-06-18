using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    [Table("order_source", Schema="catalog")]
    public class OrderSource
    {
        public OrderSource () {}
        [Key, Column("order_source_id")]
        public int Id { get; set; }
        [Column("order_source_code")]
        public string Code { get; set; }
        [Column("order_source_name")]
        public string Name { get; set; }
    }
}