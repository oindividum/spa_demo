package com.poplavok.data.utils.distributors;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        PreciseDistributor distributor = new PreciseDistributor();

        //задаем исходные вклады (доли)
        List<BigDecimal> amounts = Arrays.asList(
                new BigDecimal("60"), 
                new BigDecimal("59"), 
                new BigDecimal("70")  
        );
        
        System.out.println("Тест работы алгоритма 'Поплавок'");

        System.out.println("Вклады участников: " + amounts + " (всего " + 
            amounts.stream().reduce(BigDecimal.ZERO, BigDecimal::add) + ")");

        //сумма, которую прислал банк и которую реально надо разделить
        BigDecimal distributeAmount = new BigDecimal("7.33");
        int scale = 2; //точность 2 знака (копейки)
        
        System.out.println("Нужно разделить: " + distributeAmount + " руб.");
        System.out.println("Точность: " + scale + " знака после запятой");
        System.out.println("----------------------------------------");

        List<BigDecimal> result = distributor.distribute(amounts, distributeAmount, scale, true);

        //Вывод результатов
        BigDecimal sum = BigDecimal.ZERO;
        for (int i = 0; i < result.size(); i++) {
            System.out.println("Участник " + (i + 1) + " получил: " + result.get(i) + " руб.");
            sum = sum.add(result.get(i));
        }

        System.out.println("----------------------------------------");
        System.out.println("Итоговая распределенная сумма: " + sum + " руб.");
        if (sum.compareTo(distributeAmount) == 0) {
            System.out.println("Ни одна копейка не потерялась");
        } else {
            System.out.println("ОШИБКА. Сумма не сходится");
        }
    }
}
