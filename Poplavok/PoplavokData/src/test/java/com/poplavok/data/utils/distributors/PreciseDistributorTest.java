package com.poplavok.data.utils.distributors;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

public class PreciseDistributorTest {

    private final PreciseDistributor distributor = new PreciseDistributor();

    @Test
    public void testEqualDistribution() {
        //балансы $33.3 в сумме $99.9
        List<BigDecimal> amounts = Arrays.asList(
                new BigDecimal("33.3"),
                new BigDecimal("33.3"),
                new BigDecimal("33.3")
        );
        //делим 100 руб
        BigDecimal distributeAmount = new BigDecimal("100");

        List<BigDecimal> result = distributor.distribute(amounts, distributeAmount, 2, true);

        // расчет: [33.34, 33.33, 33.33], поплавок (+0.01) ушел первому, т.к. остатки равны
        Assertions.assertEquals(new BigDecimal("33.34"), result.get(0));
        Assertions.assertEquals(new BigDecimal("33.33"), result.get(1));
        Assertions.assertEquals(new BigDecimal("33.33"), result.get(2));
        
        BigDecimal sum = result.get(0).add(result.get(1)).add(result.get(2));
        Assertions.assertEquals(new BigDecimal("100.00"), sum);
    }

    @Test
    public void testProportionalDistributionWithDifferentRemainders() {
        // веса: 10%, 20%, 70%
        List<BigDecimal> amounts = Arrays.asList(
                new BigDecimal("10"),
                new BigDecimal("20"),
                new BigDecimal("70")
        );
        
        // делим 3.33 руб 
        BigDecimal distributeAmount = new BigDecimal("3.33");
        List<BigDecimal> result = distributor.distribute(amounts, distributeAmount, 2, true);

        //распределено ровно 3.33
        BigDecimal sum = result.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        Assertions.assertEquals(new BigDecimal("3.33"), sum);
    }
}
